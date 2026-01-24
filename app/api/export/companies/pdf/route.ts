import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTablePDF } from "@/lib/pdf-generator";
import { formatCompaniesForExport } from "@/lib/xlsx-export";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    logger.info({
      msg: "Exportando empresas para PDF",
      userId: session.user.id,
    });

    // Buscar empresas do usuário
    const companies = await prisma.company.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            contacts: true,
            deals: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formatar dados para exportação
    const formattedData = formatCompaniesForExport(companies);

    // Gerar PDF
    const buffer = generateTablePDF(formattedData, {
      title: "Relatório de Empresas",
      subtitle: `Total de ${companies.length} empresas`,
      orientation: "landscape",
      showLogo: true,
      showGeneratedDate: true,
    });

    // Retornar arquivo
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="empresas-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    logger.error({
      msg: "Erro ao exportar empresas para PDF",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Erro ao exportar empresas" },
      { status: 500 }
    );
  }
}
