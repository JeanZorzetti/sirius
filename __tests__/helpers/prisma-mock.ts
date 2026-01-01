import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended'

// Create a mock Prisma client
export const prismaMock = mockDeep<PrismaClient>()

// Reset mock before each test
export const resetPrismaMock = () => {
  mockReset(prismaMock)
}

// Mock Prisma Client constructor
export const mockPrismaClient = (): DeepMockProxy<PrismaClient> => {
  return prismaMock
}
