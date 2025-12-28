import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/settings/profile-form'

export default async function SettingsPage() {
    const user = await prisma.user.findFirst()

    if (!user) return <div>Usuário não encontrado.</div>

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">
                    Gerencie suas preferências e configurações da conta
                </p>
            </div>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Perfil</CardTitle>
                        <CardDescription>Gerencie suas informações pessoais.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProfileForm initialData={{ name: user.name || '', email: user.email }} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
