import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ORG_ID = 'a22d92c4-464e-4d59-a3b8-7c1823108c2f'

async function inspectOrg() {
    console.log("=== DETAILED ORGANIZATION INSPECTION ===\n")

    const org = await prisma.organization.findUnique({
        where: { id: ORG_ID },
        include: {
            users: true,
            contacts: true,
            deals: {
                include: {
                    contact: true,
                    user: true,
                    stage: true
                }
            },
            pipelineStages: {
                include: {
                    deals: {
                        include: {
                            contact: true,
                            user: true
                        }
                    }
                },
                orderBy: { order: 'asc' }
            }
        }
    })

    if (!org) {
        console.log(`Organization ${ORG_ID} not found`)
        return
    }

    console.log(`Organization: ${org.name} (${org.id})`)
    console.log(`\n=== CONTACTS ===`)
    if (org.contacts.length === 0) {
        console.log("No contacts")
    } else {
        org.contacts.forEach(c => {
            console.log(`\n📧 Contact: ${c.name}`)
            console.log(`   Email: ${c.email || 'N/A'}`)
            console.log(`   Phone: ${c.phone || 'N/A'}`)
            console.log(`   Company: ${c.company || 'N/A'}`)
            console.log(`   Created: ${c.createdAt}`)
        })
    }

    console.log(`\n\n=== DEALS (via org.deals) ===`)
    if (org.deals.length === 0) {
        console.log("No deals")
    } else {
        org.deals.forEach(d => {
            console.log(`\n💰 Deal: ${d.title}`)
            console.log(`   ID: ${d.id}`)
            console.log(`   Value: ${d.value}`)
            console.log(`   Stage: ${d.stage.name}`)
            console.log(`   User: ${d.user.email}`)
            console.log(`   Contact: ${d.contact?.name || 'None'}`)
            console.log(`   Created: ${d.createdAt}`)
        })
    }

    console.log(`\n\n=== PIPELINE STAGES ===`)
    for (const stage of org.pipelineStages) {
        console.log(`\n📊 Stage: ${stage.name} (order ${stage.order})`)
        console.log(`   Deals in this stage: ${stage.deals.length}`)

        if (stage.deals.length > 0) {
            stage.deals.forEach(d => {
                console.log(`\n   💰 Deal: ${d.title}`)
                console.log(`      Value: ${d.value}`)
                console.log(`      User: ${d.user.email}`)
                console.log(`      Contact: ${d.contact?.name || 'None'}`)
                console.log(`      Deal.organizationId: ${d.organizationId}`)
                console.log(`      Stage.organizationId: ${stage.organizationId}`)
                if (d.organizationId !== stage.organizationId) {
                    console.log(`      ⚠️  MISMATCH!`)
                }
            })
        }
    }
}

inspectOrg()
    .catch(e => {
        console.error("Error:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
