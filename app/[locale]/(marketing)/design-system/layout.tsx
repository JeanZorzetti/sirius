import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design System | Sirius CRM",
  description:
    "Explore o design system do Sirius CRM com componentes, tokens de design, padrões e melhores práticas para construir interfaces consistentes.",
  openGraph: {
    title: "Sirius Design System",
    description:
      "Componentes, padrões e tokens para construir interfaces consistentes no Sirius CRM",
    type: "website",
  },
};

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
