import { test, expect } from './base-test';
import { TestDataFactory } from './test-data-factory';

// Note: Prisma does not support manual index creation or TTL indexes at runtime. Some tests are adapted or skipped.
test.describe('Prisma Index Operations', () => {
  test('should query by compound indexed fields (simulate compound index)', async ({ prisma }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({ data: userData });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({ data: folderData });

    const documents = [
      TestDataFactory.createDocument(user.id, folder.id, {
        metadata: { status: 'draft', version: '1.0' }
      }),
      TestDataFactory.createDocument(user.id, folder.id, {
        metadata: { status: 'draft', version: '1.1' }
      }),
      TestDataFactory.createDocument(user.id, folder.id, {
        metadata: { status: 'review', version: '1.0' }
      })
    ];
    for (const doc of documents) {
      await prisma.document.create({ data: doc });
    }

    // ACT: Query by compound fields
    const found = await prisma.document.findMany({
      where: {
        AND: [
          { metadata: { equals: { status: 'draft' } } },
          { metadata: { equals: { version: '1.0' } } }
        ]
      }
    });

    // ASSERT: Should find at least one document
    expect(found.length).toBeGreaterThanOrEqual(1);
    found.forEach(doc => {
      expect((doc.metadata as any).status).toBe('draft');
      expect((doc.metadata as any).version).toBe('1.0');
    });
  });

  test('should query by optional field (simulate sparse index)', async ({ prisma }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({ data: userData });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({ data: folderData });

    const documents = [
      TestDataFactory.createDocument(user.id, folder.id, {
        metadata: { priority: 'high' }
      }),
      TestDataFactory.createDocument(user.id, folder.id, {
        metadata: { status: 'draft' }
      }),
      TestDataFactory.createDocument(user.id, folder.id, {
        metadata: { priority: 'low' }
      })
    ];
    for (const doc of documents) {
      await prisma.document.create({ data: doc });
    }

    // ACT: Query by optional field
    const found = await prisma.document.findMany({
      where: {
        metadata: { equals: { priority: 'high' } }
      }
    });

    // ASSERT: Should find at least one document
    expect(found.length).toBeGreaterThanOrEqual(1);
    found.forEach(doc => {
      expect((doc.metadata as any).priority).toBe('high');
    });
  });

  test.skip('should create and use TTL indexes', async ({ prisma }) => {
    // Skipped: Prisma does not support TTL indexes at runtime.
    // This test is not applicable.
  });
}); 