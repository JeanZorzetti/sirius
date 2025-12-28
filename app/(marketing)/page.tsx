import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kanban, BarChart3, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-r from-primary via-chart-1 to-chart-3 bg-clip-text text-transparent pb-2">
            Sirius CRM.
            <br />
            Brilhe nas vendas.
          </h1>
          <p className="mt-8 text-lg leading-8 text-muted-foreground sm:text-xl max-w-2xl mx-auto">
            Esqueça planilhas complexas. Foco no que importa: fechar negócios.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Button asChild size="lg" className="text-base px-8">
              <Link href="/login">Começar Agora</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="text-base px-8">
              <Link href="#demo">Ver Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24 sm:py-32 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
                  <Kanban className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">Kanban Intuitivo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Visualize seu pipeline de vendas de forma clara e organize seus leads com arrastar e soltar.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">Relatórios Inteligentes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Análises em tempo real que transformam dados em decisões estratégicas para seu time.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">Gestão de Contatos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Centralize todas as informações dos seus clientes e nunca perca uma oportunidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-6">
            Junte-se a proplayers do mercado
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Empresas de alto desempenho já estão usando nossa plataforma para acelerar vendas e maximizar resultados.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 sm:py-32 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          <h2 className="text-4xl font-bold tracking-tight sm:text-6xl mb-8">
            Pronto para crescer?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Comece gratuitamente e veja a diferença que um CRM inteligente faz nos seus resultados.
          </p>
          <Button asChild size="lg" className="text-base px-12">
            <Link href="/login">Começar Agora</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
