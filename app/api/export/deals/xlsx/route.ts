import { NextRequest, NextResponse } from "next/server";
import { autorizarExportacao, registrarExportacao } from "@/lib/exportacao";
import { escopoNegocio } from "@/lib/visibilidade";
import { prisma } from "@/lib/prisma";
import { exportToXLSX, formatDealsForExport } from "@/lib/xlsx-export";
import logger from "@/lib/logger";
import { apiError } from "@/lib/api-error";
import { ERR } from "@/lib/error-messages";

export async function GET(request: NextRequest) {
  try {
    // Owner and manager only; every export goes to the audit log (spec 011)
    const quem = await autorizarExportacao();
    if (quem instanceof Response) return quem;
    const session = { user: { id: quem.acesso.userId } };

    logger.info({
      msg: "Exportando deals para XLSX",
      userId: session.user.id,
    });

    // Buscar deals do usuário
    const deals = await prisma.deal.findMany({
      // The organization's deals the exporter may see (pipeline restriction included)
      where: escopoNegocio(quem.acesso),
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
    await registrarExportacao(quem, 'negocios', 'xlsx', deals.length, request);

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
