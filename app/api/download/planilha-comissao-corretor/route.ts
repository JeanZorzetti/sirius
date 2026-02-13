import logger from '@/lib/logger'
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Ler arquivo Excel estático da pasta public/downloads
    const filePath = join(process.cwd(), 'public', 'downloads', 'Planilha-Controle-Comissao-Corretor-2026-Sirius-CRM.xlsx');
    const fileBuffer = readFileSync(filePath);

    // Retornar arquivo com headers apropriados
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Planilha-Controle-Comissao-Corretor-2026-Sirius-CRM.xlsx"',
        'Cache-Control': 'public, max-age=86400', // Cache 24 horas
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Erro ao servir planilha');
    return NextResponse.json(
      { error: 'Erro ao servir planilha' },
      { status: 500 }
    );
  }
}
