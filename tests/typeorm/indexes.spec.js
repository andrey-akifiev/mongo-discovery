import { test, expect } from '@playwright/test';
import { BaseTest } from './base-test';
import { TestDataFactory } from './test-data-factory';

test.describe('MongoDB Indexes', () => {
  const baseTest = new BaseTest();

  test.beforeAll(async () => {
    await baseTest.beforeAll();
  });

  test.afterAll(async () => {
    await baseTest.afterAll();
  });

  test.afterEach(async () => {
    await baseTest.cleanup();
  });

  test('should use compound indexes', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    // Create documents with different statuses and versions
    const documents = [
      ...TestDataFactory.createDocuments(2, savedUser._id, savedFolder._id, {
        metadata: { status: 'draft', version: '1.0' }
      }),
      ...TestDataFactory.createDocuments(3, savedUser._id, savedFolder._id, {
        metadata: { status: 'review', version: '1.0' }
      })
    ];
    await manager.save('Document', documents);

    // ACT: Query using compound index
    const results = await manager.find('Document', {
      where: {
        'metadata.status': 'draft',
        'metadata.version': '1.0'
      }
    });

    // ASSERT: Verify compound index query
    expect(results).toHaveLength(2);
    results.forEach(doc => {
      expect(doc.metadata.status).toBe('draft');
      expect(doc.metadata.version).toBe('1.0');
    });
  });

  test('should use sparse indexes', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    // Create documents with and without priority
    const documents = [
      ...TestDataFactory.createDocuments(2, savedUser._id, savedFolder._id, {
        metadata: { priority: 'high' }
      }),
      ...TestDataFactory.createDocuments(3, savedUser._id, savedFolder._id, {
        metadata: { status: 'draft' }
      })
    ];
    await manager.save('Document', documents);

    // ACT: Query using sparse index
    const results = await manager.find('Document', {
      where: { 'metadata.priority': 'high' }
    });

    // ASSERT: Verify sparse index query
    expect(results).toHaveLength(2);
    results.forEach(doc => {
      expect(doc.metadata.priority).toBe('high');
    });
  });

  test('should use TTL indexes', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    // Create documents with expiration dates
    const documents = [
      ...TestDataFactory.createDocuments(2, savedUser._id, savedFolder._id, {
        metadata: { expiresAt: new Date(Date.now() + 1000) } // Expires in 1 second
      }),
      ...TestDataFactory.createDocuments(3, savedUser._id, savedFolder._id, {
        metadata: { expiresAt: new Date(Date.now() + 5000) } // Expires in 5 seconds
      })
    ];
    await manager.save('Document', documents);

    // ACT: Wait for TTL to take effect
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ASSERT: Verify TTL index
    const remainingDocs = await manager.find('Document', {
      where: { 'metadata.expiresAt': { $exists: true } }
    });
    expect(remainingDocs).toHaveLength(3); // Only the 5-second documents should remain
  });
}); 