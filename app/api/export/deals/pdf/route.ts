import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTablePDF } from "@/lib/pdf-generator";
import { formatDealsForExport } from "@/lib/xlsx-export";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    logger.info({
      msg: "Exportando deals para PDF",
      userId: session.user.id,
    });

    // Buscar deals do usuário
    const deals = await prisma.deal.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        pipeline: {
          select: {
            name: true,
          },
        },
        stage: {
          select: {
            name: true,
          },
        },
        contact: {
          select: {
            name: true,
            company: true,
          },
        },
        user: {
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
    const formattedData = formatDealsForExport(deals);

    // Gerar PDF
    const buffer = generateTablePDF(formattedData, {
      title: "Relatório de Oportunidades",
      subtitle: `Total de ${deals.length} oportunidades`,
      orientation: "landscape",
      showLogo: true,
      showGeneratedDate: true,
    });

    // Retornar arquivo
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="oportunidades-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    logger.error({
      msg: "Erro ao exportar deals para PDF",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Erro ao exportar oportunidades" },
      { status: 500 }
    );
  }
}
