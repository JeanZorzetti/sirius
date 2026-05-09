import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTablePDF } from "@/lib/pdf-generator";
import { formatDealsForExport } from "@/lib/xlsx-export";
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

    // Gerar PDF (lazy loading de jsPDF)
    const buffer = await generateTablePDF(formattedData, {
      title: "Relatório de Oportunidades",
      subtitle: `Total de ${deals.length} oportunidades`,
      orientation: "landscape",
      showLogo: true,
      showGeneratedDate: true,
    });

    // Retornar arquivo
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
