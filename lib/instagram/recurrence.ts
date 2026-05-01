import { prisma } from '@/lib/prisma'

export async function createNextRecurrenceChild(parentId: string): Promise<void> {
  const parent = await prisma.instagramPost.findUnique({ where: { id: parentId } })
  if (!parent || !parent.recurrenceRule) return

  const childrenCount = await prisma.instagramPost.count({ where: { recurrenceParentId: parentId } })
  if (childrenCount >= 100) return

  const next = new Date(parent.scheduledFor)
  if (parent.recurrenceRule === 'WEEKLY') {
    next.setDate(next.getDate() + 7 * (childrenCount + 1))
  } else if (parent.recurrenceRule === 'MONTHLY') {
    next.setMonth(next.getMonth() + (childrenCount + 1))
  } else {
    return
  }

  if (parent.recurrenceEndDate && next > parent.recurrenceEndDate) return

  await prisma.instagramPost.create({
    data: {
      organizationId: parent.organizationId,
      type: parent.type,
      caption: parent.caption,
      hashtags: parent.hashtags,
      altText: parent.altText,
      imageUrls: parent.imageUrls,
      slides: parent.slides,
      scheduledFor: next,
      status: 'scheduled',
      recurrenceRule: parent.recurrenceRule,
      recurrenceEndDate: parent.recurrenceEndDate,
      recurrenceParentId: parentId,
      createdById: parent.createdById,
    },
  })
}
