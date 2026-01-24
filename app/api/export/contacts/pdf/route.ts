import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTablePDF } from "@/lib/pdf-generator";
import { formatContactsForExport } from "@/lib/xlsx-export";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    logger.info({
      msg: "Exportando contatos para PDF",
      userId: session.user.id,
    });

    // Buscar contatos do usuário
    const contacts = await prisma.contact.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formatar dados para exportação
    const formattedData = formatContactsForExport(contacts);

    // Gerar PDF
    const buffer = generateTablePDF(formattedData, {
      title: "Relatório de Contatos",
      subtitle: `Total de ${contacts.length} contatos`,
      orientation: "landscape",
      showLogo: true,
      showGeneratedDate: true,
    });

    // Retornar arquivo
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="contatos-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    logger.error({
      msg: "Erro ao exportar contatos para PDF",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Erro ao exportar contatos" },
      { status: 500 }
    );
  }
}
