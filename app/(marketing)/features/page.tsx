import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Kanban, BarChart3, Users, Zap, Shield, Smartphone } from 'lucide-react'

const features = [
    {
        name: 'Pipeline Kanban',
        description: 'Visualize seus negócios em estágios claros. Arraste e solte para avançar negociações. Personalize seu funil conforme seu processo.',
        icon: Kanban,
    },
    {
        name: 'Gestão de Contatos',
        description: 'Mantenha histórico de todas as interações. Saiba exatamente quando foi o último contato e o que foi conversado.',
        icon: Users,
    },
    {
        name: 'Analytics em Tempo Real',
        description: 'Painéis que mostram a saúde do seu comercial. Taxa de conversão, ticket médio e previsão de fechamento.',
        icon: BarChart3,
    },
    {
        name: 'Automação (Em Breve)',
        description: 'Envie e-mails de follow-up automaticamente. Nunca mais esqueça de responder um cliente.',
        icon: Zap,
    },
    {
        name: 'Segurança de Dados',
        description: 'Seus dados são criptografados e isolados. backups diários garantem que você nunca perca informações.',
        icon: Shield,
    },
    {
        name: 'Mobile First',
        description: 'Acesse seu CRM de qualquer lugar. Interface totalmente responsiva para fechar negócios no celular.',
        icon: Smartphone,
    },
]

export default function FeaturesPage() {
    return (
        <div className="bg-background py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-primary">Tudo o que você precisa</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Venda mais rápido, sem complexidade
                    </p>
                    <p className="mt-6 text-lg leading-8 text-muted-foreground">
                        Desenhamos cada funcionalidade pensando na produtividade do vendedor. Menos cliques, mais fechamentos.
                    </p>
                </div>

                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                        {features.map((feature) => (
                            <div key={feature.name} className="relative pl-16">
                                <dt className="text-base font-semibold leading-7 text-foreground">
                                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                                        <feature.icon className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                                    </div>
                                    {feature.name}
                                </dt>
                                <dd className="mt-2 text-base leading-7 text-muted-foreground">{feature.description}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div className="mt-16 flex justify-center">
                    <Button asChild size="lg">
                        <Link href="/register">Testar Funcionalidades Agora</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
