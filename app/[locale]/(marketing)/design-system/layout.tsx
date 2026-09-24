import type { Metadata } from "next";
import { DEFAULT_OG_IMAGES } from '@/lib/seo/canonical'

export const metadata: Metadata = {
  title: "Design System | Sirius CRM",
  description:
    "Explore o design system do Sirius CRM com componentes, tokens de design, padrões e melhores práticas para construir interfaces consistentes.",
  openGraph: {
    images: DEFAULT_OG_IMAGES,
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
