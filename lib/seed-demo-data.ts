import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'
import { DEMO_DEALS } from '@/lib/pipeline-defaults'

/**
 * Seeds demo data for a new user to showcase CRM functionality
 * Creates: contacts, pipeline stages, deals, notes, and activities
 */
export async function seedDemoData(userId: string, organizationId: string) {
  try {
    // Get or create default pipeline
    let pipeline = await prisma.pipeline.findFirst({
      where: {
        organizationId,
        isDefault: true,
      },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        }
      }
    })

    // If no pipeline exists, create one with stages
    if (!pipeline) {
      pipeline = await prisma.pipeline.create({
        data: {
          name: 'Pipeline de Vendas',
          isDefault: true,
          organizationId,
          stages: {
            create: [
              { name: 'Novo Lead', order: 1, organizationId },
              { name: 'Qualificação', order: 2, organizationId },
              { name: 'Proposta', order: 3, organizationId },
              { name: 'Negociação', order: 4, organizationId },
              { name: 'Fechado', order: 5, organizationId },
            ]
          }
        },
        include: {
          stages: {
            orderBy: { order: 'asc' }
          }
        }
      })
    }

    const stages = pipeline.stages

    // Demo contacts data
    const demoContacts = [
      {
        name: 'Ana Silva',
        email: 'ana.silva@exemplo.com',
        phone: '(11) 98765-4321',
        company: 'Tech Solutions Ltda',
      },
      {
        name: 'Carlos Mendes',
        email: 'carlos@energiasolar.com',
        phone: '(21) 99876-5432',
        company: 'Energia Solar Rio',
      },
      {
        name: 'Beatriz Costa',
        email: 'beatriz@marketingpro.com',
        phone: '(11) 97654-3210',
        company: 'Marketing Pro',
      },
      {
        name: 'Pedro Santos',
        email: 'pedro.santos@construtora.com',
        phone: '(47) 98888-7777',
        company: 'Construtora Santos & Cia',
      },
      {
        name: 'Mariana Oliveira',
        email: 'mariana@consultoria.com',
        phone: '(31) 99999-8888',
        company: 'Consultoria Oliveira',
      },
    ]

    // Create contacts
    const contacts = await Promise.all(
      demoContacts.map(contact =>
        prisma.contact.create({
          data: {
            ...contact,
            organizationId,
          }
        })
      )
    )

    // Demo deals data — shared with the home plate, see lib/pipeline-defaults.ts
    const now = new Date()
    const demoDeals = DEMO_DEALS.map((d) => ({
      title: d.title,
      value: d.value,
      contactId: contacts[d.contactIndex].id,
      stageIndex: d.stageIndex,
      dueDate: d.won ? undefined : addDays(now, d.dueInDays),
      closeDate: d.won ? addDays(now, d.dueInDays) : undefined,
      notes: d.notes,
    }))

    // Create deals with notes and activities
    const deals = await Promise.all(
      demoDeals.map(async (deal, index) => {
        const stage = stages[deal.stageIndex]

        const createdDeal = await prisma.deal.create({
          data: {
            title: deal.title,
            value: deal.value,
            closeDate: deal.closeDate,
            dueDate: deal.dueDate,
            organizationId,
            pipelineId: pipeline!.id,
            stageId: stage.id,
            contactId: deal.contactId,
            userId,
            notes: {
              create: deal.notes.map(noteContent => ({
                content: noteContent,
                userId,
              }))
            },
            activities: {
              create: [
                {
                  type: 'DEAL_CREATED',
                  description: `Deal "${deal.title}" criado`,
                  userId,
                }
              ]
            }
          },
          include: {
            notes: true,
            activities: true,
          }
        })

        return createdDeal
      })
    )

    // Update onboarding progress
    await prisma.onboardingProgress.upsert({
      where: { userId },
      create: {
        userId,
        organizationId,
        currentStep: 1,
        completedSteps: ['demo_data_loaded'],
        status: 'IN_PROGRESS',
        stepData: {
          demoDataLoaded: true,
          loadedAt: new Date().toISOString(),
          dealsCreated: deals.length,
          contactsCreated: contacts.length,
        },
        badges: ['data_explorer'],
        totalPoints: 50,
      },
      update: {
        stepData: {
          demoDataLoaded: true,
          loadedAt: new Date().toISOString(),
          dealsCreated: deals.length,
          contactsCreated: contacts.length,
        }
      }
    })

    return {
      success: true,
      data: {
        contacts: contacts.length,
        deals: deals.length,
        pipeline: pipeline.name,
        stages: stages.length,
      }
    }
  } catch (error) {
    console.error('Error seeding demo data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Clears all demo data for a user (optional cleanup)
 */
export async function clearDemoData(userId: string, organizationId: string) {
  try {
    // Delete all deals for this user
    await prisma.deal.deleteMany({
      where: {
        userId,
        organizationId,
      }
    })

    // Note: We keep contacts as they might be referenced elsewhere
    // You can optionally delete contacts with no deals:
    // await prisma.contact.deleteMany({
    //   where: {
    //     organizationId,
    //     deals: { none: {} }
    //   }
    // })

    return { success: true }
  } catch (error) {
    console.error('Error clearing demo data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
