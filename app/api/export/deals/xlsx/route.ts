import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportToXLSX, formatDealsForExport } from "@/lib/xlsx-export";
import logger from "@/lib/logger";
import { apiError } from "@/lib/api-error";
import { ERR } from "@/lib/error-messages";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request });
    }

    logger.info({
      msg: "Exportando deals para XLSX",
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

    // Gerar XLSX (lazy loading de XLSX)
    const buffer = await exportToXLSX(formattedData, {
      sheetName: "Oportunidades",
      autoWidth: true,
    });

    // Retornar arquivo
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="oportunidades-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    logger.error({
      msg: "Erro ao exportar deals para XLSX",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request });
  }
}
