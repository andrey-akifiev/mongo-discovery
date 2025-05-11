import { test as base, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

// Extend the base test type
type TestFixtures = {
  prisma: PrismaClient;
};

export const test = base.extend<TestFixtures>({
  prisma: async ({}, use) => {
    const prisma = new PrismaClient();
    await use(prisma);
    await prisma.$disconnect();
  }
});

export { expect }; 