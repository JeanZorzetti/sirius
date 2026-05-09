import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTablePDF } from "@/lib/pdf-generator";
import { formatContactsForExport } from "@/lib/xlsx-export";
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
      msg: "Exportando contatos para PDF",
      userId: session.user.id,
    });

    // Buscar contatos da organização
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formatar dados para exportação
    const formattedData = formatContactsForExport(contacts);

    // Gerar PDF (lazy loading de jsPDF)
    const buffer = await generateTablePDF(formattedData, {
      title: "Relatório de Contatos",
      subtitle: `Total de ${contacts.length} contatos`,
      orientation: "landscape",
      showLogo: true,
      showGeneratedDate: true,
    });

    // Retornar arquivo
    return new NextResponse(new Uint8Array(buffer), {
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

    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request });
  }
}
