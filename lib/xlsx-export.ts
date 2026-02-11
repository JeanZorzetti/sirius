/**
 * Opções para exportação XLSX
 */
export interface XLSXExportOptions {
  /** Nome da planilha */
  sheetName?: string;
  /** Nome do arquivo (sem extensão) */
  fileName?: string;
  /** Largura automática das colunas */
  autoWidth?: boolean;
}

/**
 * Converte dados para XLSX e retorna um Buffer (com lazy loading)
 * @param data Array de objetos para exportar
 * @param options Opções de exportação
 * @returns Buffer do arquivo XLSX
 */
export async function exportToXLSX<T extends Record<string, any>>(
  data: T[],
  options: XLSXExportOptions = {}
): Promise<Buffer> {
  // Lazy load XLSX apenas quando necessário (reduz bundle inicial)
  const XLSX = await import("xlsx");

  const {
    sheetName = "Planilha1",
    autoWidth = true,
  } = options;

  // Criar workbook e worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-ajustar largura das colunas
  if (autoWidth && data.length > 0) {
    const headers = Object.keys(data[0]);
    const colWidths = headers.map((header) => {
      const maxLength = Math.max(
        header.length,
        ...data.map((row) => {
          const value = row[header];
          return value ? String(value).length : 0;
        })
      );
      return { wch: Math.min(maxLength + 2, 50) }; // Max 50 caracteres
    });
    worksheet["!cols"] = colWidths;
  }

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Converter para buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return buffer as Buffer;
}

/**
 * Exportar múltiplas planilhas em um único arquivo (com lazy loading)
 * @param sheets Array de planilhas com nome e dados
 * @param options Opções de exportação
 * @returns Buffer do arquivo XLSX
 */
export async function exportMultipleSheets(
  sheets: Array<{ name: string; data: Record<string, any>[] }>,
  options: Omit<XLSXExportOptions, "sheetName"> = {}
): Promise<Buffer> {
  // Lazy load XLSX
  const XLSX = await import("xlsx");

  const { autoWidth = true } = options;

  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, data }) => {
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-ajustar largura das colunas
    if (autoWidth && data.length > 0) {
      const headers = Object.keys(data[0]);
      const colWidths = headers.map((header) => {
        const maxLength = Math.max(
          header.length,
          ...data.map((row) => {
            const value = row[header];
            return value ? String(value).length : 0;
          })
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet["!cols"] = colWidths;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer as Buffer;
}

/**
 * Formatar dados de contatos para exportação
 */
export function formatContactsForExport(contacts: any[]) {
  return contacts.map((contact) => ({
    Nome: contact.name,
    Email: contact.email || "-",
    Telefone: contact.phone || "-",
    Empresa: contact.company || "-",
    "Data de Criação": contact.createdAt
      ? new Date(contact.createdAt).toLocaleDateString("pt-BR")
      : "-",
    "Última Atualização": contact.updatedAt
      ? new Date(contact.updatedAt).toLocaleDateString("pt-BR")
      : "-",
  }));
}

/**
 * Formatar dados de deals para exportação
 */
export function formatDealsForExport(deals: any[]) {
  return deals.map((deal) => ({
    Título: deal.title,
    Pipeline: deal.pipeline?.name || "-",
    Estágio: deal.stage?.name || "-",
    Contato: deal.contact?.name || "-",
    "Empresa do Contato": deal.contact?.company || "-",
    Valor: deal.value
      ? `R$ ${Number(deal.value).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`
      : "-",
    "Data de Fechamento": deal.closeDate
      ? new Date(deal.closeDate).toLocaleDateString("pt-BR")
      : "-",
    "Data de Follow-up": deal.dueDate
      ? new Date(deal.dueDate).toLocaleDateString("pt-BR")
      : "-",
    "Data de Criação": deal.createdAt
      ? new Date(deal.createdAt).toLocaleDateString("pt-BR")
      : "-",
    Responsável: deal.user?.name || "-",
  }));
}

/**
 * Formatar dados de atividades para exportação
 */
export function formatActivitiesForExport(activities: any[]) {
  return activities.map((activity) => ({
    Tipo: activity.type,
    Título: activity.title,
    Descrição: activity.description || "-",
    Status: activity.status,
    Prioridade: activity.priority || "-",
    "Data de Vencimento": activity.dueDate
      ? new Date(activity.dueDate).toLocaleDateString("pt-BR")
      : "-",
    Empresa: activity.company?.name || "-",
    Contato: activity.contact?.name || "-",
    Deal: activity.deal?.title || "-",
    Responsável: activity.assignedTo?.name || "-",
    "Data de Criação": activity.createdAt
      ? new Date(activity.createdAt).toLocaleDateString("pt-BR")
      : "-",
  }));
}
