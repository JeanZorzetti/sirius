import Link from 'next/link'
import { RegisterForm } from "./register-form"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"

export default async function RegisterPage({
    searchParams,
}: {
    searchParams: { invite?: string }
}) {
    const inviteToken = searchParams.invite
    let inviteData = null

    if (inviteToken) {
        inviteData = await prisma.invite.findUnique({
            where: { token: inviteToken },
            include: { organization: true }
        })
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-950">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">
                        {inviteData ? `Junte-se a ${inviteData.organization.name}` : "Crie sua conta"}
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        {inviteData ? "Crie sua conta para acessar o time." : "Comece a usar o Sirius CRM gratuitamente."}
                    </CardDescription>
                </CardHeader>
                <RegisterForm inviteData={inviteData} inviteToken={inviteToken} />
            </Card>
        </div>
    )
}
