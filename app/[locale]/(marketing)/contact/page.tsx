"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const subjects = [
  { value: "sales", label: "Informacoes comerciais" },
  { value: "support", label: "Suporte tecnico" },
  { value: "partnership", label: "Parcerias" },
  { value: "feedback", label: "Feedback e sugestoes" },
  { value: "other", label: "Outros assuntos" },
];

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar mensagem");
      }

      setIsSubmitted(true);
      toast({
        title: "Mensagem enviada!",
        description: "Entraremos em contato em breve.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://sirius.roilabs.com.br",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Contato",
        item: "https://sirius.roilabs.com.br/contact",
      },
    ],
  };

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contato - Sirius CRM",
    description: "Entre em contato com a equipe do Sirius CRM",
    url: "https://sirius.roilabs.com.br/contact",
    mainEntity: {
      "@type": "Organization",
      name: "Sirius CRM",
      email: "contato@roilabs.com.br",
      url: "https://sirius.roilabs.com.br",
    },
  };

  if (isSubmitted) {
    return (
      <>
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <div className="bg-background min-h-[80vh] flex items-center justify-center">
          <div className="mx-auto max-w-md text-center px-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Mensagem Enviada!
            </h1>
            <p className="text-muted-foreground mb-8">
              Obrigado por entrar em contato. Nossa equipe recebeu sua mensagem
              e responderemos o mais breve possivel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/">Voltar ao Inicio</Link>
              </Button>
              <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                Enviar Nova Mensagem
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="contact-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />

      <div className="bg-background">
        {/* Hero Section */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Entre em Contato
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Tem alguma duvida, sugestao ou precisa de ajuda? Nossa equipe
                esta pronta para atender voce.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info + Form */}
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Contact Info */}
              <div className="lg:col-span-1 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Informacoes de Contato
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Email</h3>
                        <p className="text-muted-foreground">
                          contato@roilabs.com.br
                        </p>
                        <p className="text-muted-foreground">
                          suporte@roilabs.com.br
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          Chat ao Vivo
                        </h3>
                        <p className="text-muted-foreground">
                          Disponivel no painel do cliente
                        </p>
                        <p className="text-muted-foreground">
                          Horario comercial
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          Horario de Atendimento
                        </h3>
                        <p className="text-muted-foreground">
                          Segunda a Sexta: 9h - 18h
                        </p>
                        <p className="text-muted-foreground">
                          Sabado: 9h - 13h
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          Localizacao
                        </h3>
                        <p className="text-muted-foreground">
                          Brasil - Atendimento 100% remoto
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">
                    Tempo medio de resposta
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Respondemos a maioria das mensagens em ate 24 horas uteis.
                    Para suporte urgente, utilize o chat ao vivo no painel.
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="bg-card border rounded-lg p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Envie sua Mensagem
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo *</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Seu nome"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Input
                          id="company"
                          name="company"
                          type="text"
                          placeholder="Nome da empresa"
                          value={formData.company}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto *</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, subject: value }))
                        }
                        required
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o assunto" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.value} value={subject.value}>
                              {subject.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Descreva sua duvida, sugestao ou como podemos ajudar..."
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <Button type="submit" size="lg" disabled={isLoading} className="w-full sm:w-auto">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Perguntas Frequentes
              </h2>
              <p className="mt-4 text-muted-foreground">
                Confira as respostas para as duvidas mais comuns
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Quanto tempo leva para ter resposta?
                </h3>
                <p className="text-muted-foreground">
                  Nossa equipe responde a maioria das mensagens em ate 24 horas
                  uteis. Para assuntos urgentes, recomendamos o chat ao vivo.
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Como faco para testar o Sirius CRM?
                </h3>
                <p className="text-muted-foreground">
                  Voce pode criar uma conta gratuita e testar todas as
                  funcionalidades por 14 dias sem compromisso.{" "}
                  <Link href="/register" className="text-primary hover:underline">
                    Criar conta gratis
                  </Link>
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Voces oferecem treinamento?
                </h3>
                <p className="text-muted-foreground">
                  Sim! Alem da documentacao completa, oferecemos sessoes de
                  onboarding para novos clientes e treinamentos para equipes.
                </p>
              </div>
            </div>
            <div className="mt-10 text-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/help">Ver Central de Ajuda</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
