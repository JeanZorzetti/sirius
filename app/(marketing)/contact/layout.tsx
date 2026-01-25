import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato | Sirius CRM",
  description:
    "Entre em contato com a equipe do Sirius CRM. Estamos prontos para ajudar com duvidas, sugestoes, parcerias ou suporte tecnico.",
  openGraph: {
    title: "Contato | Sirius CRM",
    description:
      "Entre em contato com a equipe do Sirius CRM. Estamos prontos para ajudar.",
    url: "https://sirius.roilabs.com.br/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
