import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mongodb://root:example@localhost:27017/test?authSource=admin'
    }
  }
});

test.describe('Prisma Basic Operations', () => {
  test.beforeAll(async () => {
    // Ensure connection is established
    await prisma.$connect();
  });

  test.afterAll(async () => {
    // Close the connection
    await prisma.$disconnect();
  });

  test('should create a new user', async () => {
    const userData = {
      name: 'Alice Smith',
      email: 'alice@example.com',
      age: 28
    };

    const user = await prisma.user.create({
      data: userData
    });

    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    expect(user.age).toBe(userData.age);
  });
}); 