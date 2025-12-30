import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkContacts() {
    console.log("=== CHECKING ALL CONTACTS ===\n")

    const contacts = await prisma.contact.findMany({
        include: {
            organization: true,
            deals: true
        },
        orderBy: {
            name: 'asc'
        }
    })

    console.log(`Total contacts: ${contacts.length}\n`)

    for (const contact of contacts) {
        console.log(`📧 Contact: ${contact.name}`)
        console.log(`   Email: ${contact.email || 'N/A'}`)
        console.log(`   Company: ${contact.company || 'N/A'}`)
        console.log(`   Organization: ${contact.organization.name} (${contact.organizationId})`)
        console.log(`   Deals: ${contact.deals.length}`)
        console.log(`   Created: ${contact.createdAt}`)
        console.log()
    }

    // Check for duplicates
    const contactsByName = new Map<string, typeof contacts>()
    for (const contact of contacts) {
        const existing = contactsByName.get(contact.name) || []
        existing.push(contact)
        contactsByName.set(contact.name, existing)
    }

    console.log("\n=== DUPLICATE CONTACTS ===")
    let foundDuplicates = false
    for (const [name, list] of contactsByName) {
        if (list.length > 1) {
            foundDuplicates = true
            console.log(`\n"${name}" appears ${list.length} times:`)
            list.forEach(c => {
                console.log(`  - Org: ${c.organization.name} (${c.organizationId}), Deals: ${c.deals.length}`)
            })
        }
    }
    if (!foundDuplicates) {
        console.log("No duplicate contacts found")
    }
}

checkContacts()
    .catch(e => {
        console.error("Error:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
