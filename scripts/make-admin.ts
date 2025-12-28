import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'jeanzorzetti@gmail.com'

    console.log(`Promoting ${email} to ADMIN...`)

    const user = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' },
    })

    console.log('User updated:', user)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
