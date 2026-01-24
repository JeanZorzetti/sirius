import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Opções para geração de PDF
 */
export interface PDFGeneratorOptions {
  /** Título do documento */
  title?: string;
  /** Subtítulo ou descrição */
  subtitle?: string;
  /** Orientação da página */
  orientation?: "portrait" | "landscape";
  /** Mostrar logo */
  showLogo?: boolean;
  /** Mostrar data de geração */
  showGeneratedDate?: boolean;
  /** Footer customizado */
  footer?: string;
}

/**
 * Gera PDF de tabela a partir de dados
 * @param data Array de objetos para gerar PDF
 * @param options Opções de geração
 * @returns Buffer do PDF
 */
export function generateTablePDF<T extends Record<string, any>>(
  data: T[],
  options: PDFGeneratorOptions = {}
): Buffer {
  const {
    title = "Relatório",
    subtitle,
    orientation = "portrait",
    showLogo = true,
    showGeneratedDate = true,
    footer = "Gerado por Sirius CRM - ROI Labs",
  } = options;

  // Criar documento PDF
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  let yPosition = 15;

  // Logo e cabeçalho
  if (showLogo) {
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(139, 92, 246); // Purple-500
    doc.text("Sirius CRM", 15, yPosition);
    yPosition += 10;
  }

  // Título
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(title, 15, yPosition);
  yPosition += 8;

  // Subtítulo
  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 15, yPosition);
    yPosition += 6;
  }

  // Data de geração
  if (showGeneratedDate) {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    const generatedDate = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`Gerado em: ${generatedDate}`, 15, yPosition);
    yPosition += 10;
  }

  // Preparar dados da tabela
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((header) => row[header] || "-"));

    // Gerar tabela
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPosition,
      theme: "grid",
      headStyles: {
        fillColor: [139, 92, 246], // Purple-500
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // Gray-50
      },
      margin: { top: yPosition, left: 15, right: 15 },
      didDrawPage: (data) => {
        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          footer,
          15,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          `Página ${currentPage} de ${pageCount}`,
          doc.internal.pageSize.width - 40,
          doc.internal.pageSize.height - 10
        );
      },
    });
  } else {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text("Nenhum dado disponível para exportação.", 15, yPosition);
  }

  // Converter para buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}

/**
 * Gera PDF de relatório customizado
 */
export function generateCustomReportPDF(config: {
  title: string;
  sections: Array<{
    title: string;
    content: string | string[];
  }>;
  options?: PDFGeneratorOptions;
}): Buffer {
  const { title, sections, options = {} } = config;
  const {
    orientation = "portrait",
    showLogo = true,
    showGeneratedDate = true,
    footer = "Gerado por Sirius CRM - ROI Labs",
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  let yPosition = 15;

  // Logo
  if (showLogo) {
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(139, 92, 246);
    doc.text("Sirius CRM", 15, yPosition);
    yPosition += 10;
  }

  // Título principal
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(title, 15, yPosition);
  yPosition += 10;

  // Data de geração
  if (showGeneratedDate) {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    const generatedDate = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`Gerado em: ${generatedDate}`, 15, yPosition);
    yPosition += 8;
  }

  // Seções
  sections.forEach((section) => {
    // Verificar se precisa de nova página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Título da seção
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(139, 92, 246);
    doc.text(section.title, 15, yPosition);
    yPosition += 8;

    // Conteúdo da seção
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);

    if (Array.isArray(section.content)) {
      section.content.forEach((line) => {
        const splitText = doc.splitTextToSize(line, 180);
        doc.text(splitText, 15, yPosition);
        yPosition += splitText.length * 5;
      });
    } else {
      const splitText = doc.splitTextToSize(section.content, 180);
      doc.text(splitText, 15, yPosition);
      yPosition += splitText.length * 5;
    }

    yPosition += 5;
  });

  // Footer em todas as páginas
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(footer, 15, doc.internal.pageSize.height - 10);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width - 40,
      doc.internal.pageSize.height - 10
    );
  }

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}

/**
 * Gera PDF de proposta comercial
 */
export function generateProposalPDF(proposal: {
  clientName: string;
  contactName: string;
  proposalNumber: string;
  validUntil: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discount?: number;
  total: number;
  terms?: string[];
  notes?: string;
}): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let yPosition = 15;

  // Logo e cabeçalho
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(139, 92, 246);
  doc.text("Sirius CRM", 15, yPosition);

  // Número da proposta
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Proposta #${proposal.proposalNumber}`, 15, yPosition + 7);

  yPosition += 20;

  // Informações do cliente
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Cliente:", 15, yPosition);
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(proposal.clientName, 15, yPosition);
  yPosition += 5;
  doc.text(`Atenção: ${proposal.contactName}`, 15, yPosition);
  yPosition += 10;

  // Validade
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Válida até: ${new Date(proposal.validUntil).toLocaleDateString("pt-BR")}`,
    15,
    yPosition
  );
  yPosition += 10;

  // Tabela de itens
  const itemsData = proposal.items.map((item) => [
    item.description,
    item.quantity.toString(),
    `R$ ${item.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    `R$ ${item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    head: [["Descrição", "Qtd", "Valor Unit.", "Total"]],
    body: itemsData,
    startY: yPosition,
    theme: "grid",
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Totais
  const totalsX = 145;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", totalsX, yPosition);
  doc.text(
    `R$ ${proposal.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    totalsX + 30,
    yPosition,
    { align: "right" }
  );
  yPosition += 6;

  if (proposal.discount) {
    doc.text("Desconto:", totalsX, yPosition);
    doc.text(
      `R$ ${proposal.discount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      totalsX + 30,
      yPosition,
      { align: "right" }
    );
    yPosition += 6;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", totalsX, yPosition);
  doc.text(
    `R$ ${proposal.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    totalsX + 30,
    yPosition,
    { align: "right" }
  );
  yPosition += 15;

  // Termos e condições
  if (proposal.terms && proposal.terms.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Termos e Condições:", 15, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    proposal.terms.forEach((term, index) => {
      const splitText = doc.splitTextToSize(`${index + 1}. ${term}`, 180);
      doc.text(splitText, 15, yPosition);
      yPosition += splitText.length * 5;
    });
    yPosition += 5;
  }

  // Observações
  if (proposal.notes) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Observações:", 15, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(proposal.notes, 180);
    doc.text(splitNotes, 15, yPosition);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Gerado por Sirius CRM - ROI Labs",
    15,
    doc.internal.pageSize.height - 10
  );

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
