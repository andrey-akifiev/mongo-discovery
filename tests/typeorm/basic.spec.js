import { test, expect } from '@playwright/test';
import { BaseTest } from './base-test';
import { TestDataFactory } from './test-data-factory';

test.describe('Basic MongoDB Operations', () => {
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

  test('should perform basic CRUD operations', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    const documentData = TestDataFactory.createDocument(savedUser._id, savedFolder._id);
    const savedDocument = await manager.save('Document', documentData);

    // ASSERT: Verify creation
    expect(savedDocument).toBeTruthy();
    expect(savedDocument.name).toBe(documentData.name);
    expect(savedDocument.ownerId).toBe(savedUser._id);
    expect(savedDocument.folderId).toBe(savedFolder._id);

    // ACT: Update document
    const updatedName = 'Updated Document Name';
    await manager.update('Document', 
      { _id: savedDocument._id },
      { $set: { name: updatedName } }
    );

    // ASSERT: Verify update
    const updatedDocument = await manager.findOne('Document', { 
      where: { _id: savedDocument._id } 
    });
    expect(updatedDocument.name).toBe(updatedName);

    // ACT: Delete document
    await manager.delete('Document', { _id: savedDocument._id });

    // ASSERT: Verify deletion
    const deletedDocument = await manager.findOne('Document', { 
      where: { _id: savedDocument._id } 
    });
    expect(deletedDocument).toBeNull();
  });

  test('should handle find operations', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    // Create multiple documents
    const documents = TestDataFactory.createDocuments(3, savedUser._id, savedFolder._id, {
      metadata: { status: 'draft' }
    });
    await manager.save('Document', documents);

    // ACT: Find all documents
    const allDocuments = await manager.find('Document', {
      where: { ownerId: savedUser._id }
    });
    expect(allDocuments).toHaveLength(3);

    // ACT: Find with conditions
    const draftDocuments = await manager.find('Document', {
      where: { 
        ownerId: savedUser._id,
        'metadata.status': 'draft'
      }
    });
    expect(draftDocuments).toHaveLength(3);

    // ACT: Find with pagination
    const paginatedDocuments = await manager.find('Document', {
      where: { ownerId: savedUser._id },
      skip: 1,
      take: 2
    });
    expect(paginatedDocuments).toHaveLength(2);
  });

  test('should handle count operations', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    // Create documents with different statuses
    const documents = [
      ...TestDataFactory.createDocuments(2, savedUser._id, savedFolder._id, {
        metadata: { status: 'draft' }
      }),
      ...TestDataFactory.createDocuments(3, savedUser._id, savedFolder._id, {
        metadata: { status: 'review' }
      })
    ];
    await manager.save('Document', documents);

    // ACT & ASSERT: Count all documents
    const totalCount = await manager.count('Document', {
      where: { ownerId: savedUser._id }
    });
    expect(totalCount).toBe(5);

    // ACT & ASSERT: Count with conditions
    const draftCount = await manager.count('Document', {
      where: { 
        ownerId: savedUser._id,
        'metadata.status': 'draft'
      }
    });
    expect(draftCount).toBe(2);
  });

  test('should handle existence checks', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    const documentData = TestDataFactory.createDocument(savedUser._id, savedFolder._id);
    const savedDocument = await manager.save('Document', documentData);

    // ACT & ASSERT: Check existence
    const exists = await manager.findOne('Document', {
      where: { _id: savedDocument._id },
      select: ['_id']
    });
    expect(exists).toBeTruthy();

    // ACT & ASSERT: Check non-existence
    const nonExists = await manager.findOne('Document', {
      where: { _id: 'non-existent-id' },
      select: ['_id']
    });
    expect(nonExists).toBeNull();
  });
}); 