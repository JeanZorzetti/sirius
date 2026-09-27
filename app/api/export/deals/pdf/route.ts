import { NextRequest, NextResponse } from "next/server";
import { autorizarExportacao, registrarExportacao } from "@/lib/exportacao";
import { escopoNegocio } from "@/lib/visibilidade";
import { prisma } from "@/lib/prisma";
import { generateTablePDF } from "@/lib/pdf-generator";
import { formatDealsForExport } from "@/lib/xlsx-export";
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
      msg: "Exportando deals para PDF",
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

    // Gerar PDF (lazy loading de jsPDF)
    const buffer = await generateTablePDF(formattedData, {
      title: "Relatório de Oportunidades",
      subtitle: `Total de ${deals.length} oportunidades`,
      orientation: "landscape",
      showLogo: true,
      showGeneratedDate: true,
    });

    // Retornar arquivo
    await registrarExportacao(quem, 'negocios', 'pdf', deals.length, request);

    return new NextResponse(new Uint8Array(buffer), {
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

    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request });
  }
}
