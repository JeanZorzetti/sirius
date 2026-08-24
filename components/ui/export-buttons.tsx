"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EMPTY_MESSAGE: Record<ExportButtonsProps["resourceType"], string> = {
  deals: "Nenhum deal para exportar ainda",
  contacts: "Nenhum contato para exportar ainda",
  companies: "Nenhuma empresa para exportar ainda",
};

// Caminhos literais (não template string): scripts/audit-dead-code.js resolve
// chamador de rota por busca textual de "/api/...", não em runtime.
const EXPORT_ROUTES: Record<ExportButtonsProps["resourceType"], Record<"xlsx" | "pdf", string>> = {
  deals: { xlsx: "/api/export/deals/xlsx", pdf: "/api/export/deals/pdf" },
  contacts: { xlsx: "/api/export/contacts/xlsx", pdf: "/api/export/contacts/pdf" },
  companies: { xlsx: "/api/export/companies/xlsx", pdf: "/api/export/companies/pdf" },
};

interface ExportButtonsProps {
  resourceType: "contacts" | "companies" | "deals";
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  /** Desabilita o controle quando a listagem em tela está vazia — o clique nunca chega a acontecer. */
  disabled?: boolean;
}

export function ExportButtons({
  resourceType,
  label = "Exportar tudo",
  variant = "outline",
  size = "default",
  disabled = false,
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<"xlsx" | "pdf" | null>(null);

  const handleExport = async (format: "xlsx" | "pdf") => {
    try {
      setIsExporting(format);

      const response = await fetch(EXPORT_ROUTES[resourceType][format], {
        method: "GET",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao exportar");
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${resourceType}_${new Date().toISOString().split("T")[0]}.${format}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Arquivo ${format.toUpperCase()} exportado com sucesso!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao exportar arquivo"
      );
    } finally {
      setIsExporting(null);
    }
  };

  const isLoading = isExporting !== null;

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-block">
              <Button
                variant={variant}
                size={size}
                aria-disabled="true"
                className="pointer-events-none opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {label}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{EMPTY_MESSAGE[resourceType]}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              {label}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Formato de exportação</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport("xlsx")}
          disabled={isLoading}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
          Exportar como Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          disabled={isLoading}
        >
          <FileText className="w-4 h-4 mr-2 text-red-600" />
          Exportar como PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
