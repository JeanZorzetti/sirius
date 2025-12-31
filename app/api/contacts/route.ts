import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, phone, email } = body

        if (!name) {
            return NextResponse.json(
                { error: 'Nome é obrigatório' },
                { status: 400 }
            )
        }

        // For MVP, get first user's organization
        const user = await prisma.user.findFirst({
            select: { organizationId: true }
        })

        if (!user?.organizationId) {
            return NextResponse.json(
                { error: 'Organização não encontrada' },
                { status: 404 }
            )
        }

        const contact = await prisma.contact.create({
            data: {
                name,
                phone: phone || null,
                email: email || null,
                organizationId: user.organizationId
            }
        })

        return NextResponse.json(contact)
    } catch (error) {
        console.error('Error creating contact:', error)
        return NextResponse.json(
            { error: 'Erro ao criar contato' },
            { status: 500 }
        )
    }
}
