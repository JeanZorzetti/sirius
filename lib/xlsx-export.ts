import * as XLSX from "xlsx";

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
  /** Estilos customizados para cabeçalho */
  headerStyle?: XLSX.CellStyle;
}

/**
 * Converte dados para XLSX e retorna um Buffer
 * @param data Array de objetos para exportar
 * @param options Opções de exportação
 * @returns Buffer do arquivo XLSX
 */
export function exportToXLSX<T extends Record<string, any>>(
  data: T[],
  options: XLSXExportOptions = {}
): Buffer {
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
 * Exportar múltiplas planilhas em um único arquivo
 * @param sheets Array de planilhas com nome e dados
 * @param options Opções de exportação
 * @returns Buffer do arquivo XLSX
 */
export function exportMultipleSheets(
  sheets: Array<{ name: string; data: Record<string, any>[] }>,
  options: Omit<XLSXExportOptions, "sheetName"> = {}
): Buffer {
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
    Email: contact.email,
    Telefone: contact.phone || "-",
    Empresa: contact.company?.name || "-",
    Cargo: contact.position || "-",
    Status: contact.status || "Ativo",
    "Data de Criação": contact.createdAt
      ? new Date(contact.createdAt).toLocaleDateString("pt-BR")
      : "-",
    "Última Atualização": contact.updatedAt
      ? new Date(contact.updatedAt).toLocaleDateString("pt-BR")
      : "-",
  }));
}

/**
 * Formatar dados de empresas para exportação
 */
export function formatCompaniesForExport(companies: any[]) {
  return companies.map((company) => ({
    Nome: company.name,
    CNPJ: company.cnpj || "-",
    Telefone: company.phone || "-",
    Email: company.email || "-",
    Website: company.website || "-",
    Cidade: company.city || "-",
    Estado: company.state || "-",
    "Número de Contatos": company._count?.contacts || 0,
    "Número de Deals": company._count?.deals || 0,
    "Data de Criação": company.createdAt
      ? new Date(company.createdAt).toLocaleDateString("pt-BR")
      : "-",
  }));
}

/**
 * Formatar dados de deals para exportação
 */
export function formatDealsForExport(deals: any[]) {
  return deals.map((deal) => ({
    Título: deal.title,
    Empresa: deal.company?.name || "-",
    Contato: deal.contact?.name || "-",
    Valor: deal.value
      ? `R$ ${Number(deal.value).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`
      : "-",
    Estágio: deal.stage || "-",
    Status: deal.status || "-",
    Probabilidade: deal.probability ? `${deal.probability}%` : "-",
    "Data de Fechamento Prevista": deal.expectedCloseDate
      ? new Date(deal.expectedCloseDate).toLocaleDateString("pt-BR")
      : "-",
    "Data de Criação": deal.createdAt
      ? new Date(deal.createdAt).toLocaleDateString("pt-BR")
      : "-",
    Responsável: deal.owner?.name || "-",
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
