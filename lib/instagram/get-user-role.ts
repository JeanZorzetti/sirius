import { prisma } from '@/lib/prisma'

export async function getUserRole(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { orgRole: true },
  })
  return user?.orgRole ?? 'MEMBER'
}
