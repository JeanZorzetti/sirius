import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportToXLSX, formatContactsForExport } from "@/lib/xlsx-export";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    logger.info({
      msg: "Exportando contatos para XLSX",
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

    // Gerar XLSX
    const buffer = exportToXLSX(formattedData, {
      sheetName: "Contatos",
      autoWidth: true,
    });

    // Retornar arquivo
    return new NextResponse(buffer, {
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

    return NextResponse.json(
      { error: "Erro ao exportar contatos" },
      { status: 500 }
    );
  }
}
