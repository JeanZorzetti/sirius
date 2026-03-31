/**
 * Root Layout (minimal)
 *
 * Este arquivo é o shell mínimo do Next.js App Router.
 * Toda a lógica de providers, fonts, analytics, Schema.org e i18n
 * vive em app/[locale]/layout.tsx, que é carregado para todas as rotas localizadas.
 *
 * Este layout só é usado por páginas fora do [locale], como:
 * - app/global-error.tsx (erro crítico de runtime)
 * - Routes de API (não têm layout)
 */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // app/[locale]/layout.tsx renderiza <html> e <body>
  // este layout é transparente para não duplicar o shell HTML
  return <>{children}</>
}
