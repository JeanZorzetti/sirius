import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportToXLSX, formatCompaniesForExport } from "@/lib/xlsx-export";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    logger.info({
      msg: "Exportando empresas para XLSX",
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

    // Gerar XLSX
    const buffer = exportToXLSX(formattedData, {
      sheetName: "Empresas",
      autoWidth: true,
    });

    // Retornar arquivo
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="empresas-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    logger.error({
      msg: "Erro ao exportar empresas para XLSX",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Erro ao exportar empresas" },
      { status: 500 }
    );
  }
}
