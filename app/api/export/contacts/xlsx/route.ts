import { NextRequest, NextResponse } from "next/server";
import { autorizarExportacao, registrarExportacao } from "@/lib/exportacao";
import { prisma } from "@/lib/prisma";
import { exportToXLSX, formatContactsForExport } from "@/lib/xlsx-export";
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
      msg: "Exportando contatos para XLSX",
      userId: session.user.id,
    });

    // Buscar contatos da organização
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId: quem.acesso.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formatar dados para exportação
    const formattedData = formatContactsForExport(contacts);

    // Gerar XLSX (lazy loading de XLSX)
    const buffer = await exportToXLSX(formattedData, {
      sheetName: "Contatos",
      autoWidth: true,
    });

    // Retornar arquivo
    await registrarExportacao(quem, 'contatos', 'xlsx', contacts.length, request);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="contatos-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    logger.error({
      msg: "Erro ao exportar contatos para XLSX",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request });
  }
}
