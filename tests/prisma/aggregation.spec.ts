import { test, expect } from './base-test';
import { TestDataFactory } from './test-data-factory';
import { v4 as uuid } from 'uuid';

// Note: Prisma does not support all MongoDB aggregation features. Some tests are adapted or skipped.
test.describe('Prisma Aggregation Operations', () => {
  test('should join documents and folders (simulate $lookup)', async ({ prisma }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({ data: userData });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({ data: folderData });

    const documents = [
      TestDataFactory.createDocument(user.id, folder.id, {
        name: 'Doc 1',
        metadata: { status: 'draft', version: '1.0' }
      }),
      TestDataFactory.createDocument(user.id, folder.id, {
        name: 'Doc 2',
        metadata: { status: 'review', version: '1.0' }
      })
    ];
    for (const doc of documents) {
      await prisma.document.create({ data: doc });
    }

    // ACT: Join documents and folders using Prisma include
    const result = await prisma.document.findMany({
      where: { ownerId: user.id },
      include: { folder: true }
    });

    // ASSERT: Verify join results
    expect(result.length).toBe(2);
    result.forEach(doc => {
      expect(doc.folder).toBeDefined();
      expect(doc.name).toBeDefined();
      expect((doc.metadata as any).status).toBeDefined();
    });
  });

  test('should aggregate status and file size (simulate $facet)', async ({ prisma }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({ data: userData });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({ data: folderData });

    const status1 = uuid();
    const status2 = uuid();

    const documents = [
      TestDataFactory.createDocument(user.id, folder.id, {
        metadata: { status: status1, version: '1.0', fileSize: 1000 }
      }),
      TestDataFactory.createDocument(user.id, folder.id, {
        metadata: { status: status1, version: '1.1', fileSize: 2000 }
      }),
      TestDataFactory.createDocument(user.id, folder.id, {
        metadata: { status: status2, version: '1.0', fileSize: 1500 }
      })
    ];
    for (const doc of documents) {
      await prisma.document.create({ data: doc });
    }

    // ACT: Aggregate status counts and file size stats
    const allDocs = await prisma.document.findMany({ where: { ownerId: user.id } });
    const statusCounts: Record<string, number> = {};
    let totalSize = 0;
    let count = 0;
    allDocs.forEach(doc => {
      const status = (doc.metadata as any).status;
      const fileSize = (doc.metadata as any).fileSize || 0;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      totalSize += fileSize;
      count++;
    });
    const avgSize = count ? totalSize / count : 0;

    // ASSERT: Verify aggregation results
    expect(Object.keys(statusCounts).length).toBe(2);
    expect(avgSize).toBeGreaterThan(0);
  });

  test('should unwind tags and count occurrences (simulate $unwind)', async ({ prisma }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({ data: userData });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({ data: folderData });

    const documents = [
      TestDataFactory.createDocument(user.id, folder.id, {
        tags: ['urgent', 'confidential', 'review'],
        metadata: { status: 'draft' }
      }),
      TestDataFactory.createDocument(user.id, folder.id, {
        tags: ['normal', 'public'],
        metadata: { status: 'draft' }
      })
    ];
    for (const doc of documents) {
      await prisma.document.create({ data: doc });
    }

    // ACT: Unwind tags and count
    const allDocs = await prisma.document.findMany({ where: { ownerId: user.id } });
    const tagCounts: Record<string, number> = {};
    allDocs.forEach(doc => {
      doc.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // ASSERT: Verify tag counts
    expect(Object.keys(tagCounts).length).toBe(5); // Total unique tags
    Object.values(tagCounts).forEach(count => {
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  test('should compute fields in memory (simulate $addFields)', async ({ prisma }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({ data: userData });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({ data: folderData });

    const documents = [
      TestDataFactory.createDocument(user.id, folder.id, {
        metadata: { status: 'draft', fileSize: 1000 }
      }),
      TestDataFactory.createDocument(user.id, folder.id, {
        metadata: { status: 'draft', fileSize: 2000 }
      })
    ];
    for (const doc of documents) {
      await prisma.document.create({ data: doc });
    }

    // ACT: Compute fields in memory
    const allDocs = await prisma.document.findMany({ where: { ownerId: user.id } });
    const computed = allDocs.map(doc => {
      const fileSize = (doc.metadata as any).fileSize || 0;
      return {
        ...doc,
        metadata: Object.assign({}, doc.metadata, {
          sizeInMB: fileSize / (1024 * 1024),
          isLarge: fileSize > 1500
        })
      };
    });

    // ASSERT: Verify computed fields
    computed.forEach(doc => {
      expect((doc.metadata as any).sizeInMB).toBeDefined();
      expect(typeof (doc.metadata as any).isLarge).toBe('boolean');
    });
  });
}); 