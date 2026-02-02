import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeUserAdmin() {
    const userId = 'd62938d9-a2ba-476f-9691-c4c59b101d7c'

    console.log(`Updating user ${userId} to ADMIN role...`)

    const user = await prisma.user.update({
        where: { id: userId },
        data: { role: 'ADMIN' },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            orgRole: true
        }
    })

    console.log('✅ User updated successfully:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   OrgRole: ${user.orgRole}`)
}

makeUserAdmin()
    .then(async () => {
        await prisma.$disconnect()
        process.exit(0)
    })
    .catch(async (e) => {
        console.error('❌ Error:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
