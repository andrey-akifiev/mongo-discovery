import { test, expect } from '@playwright/test';
import { BaseTest } from './base-test';
import { TestDataFactory } from './test-data-factory';

test.describe('MongoDB Update Operations', () => {
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

  test('should handle basic updates', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    // ACT: Update single field
    await manager.update('User', 
      { _id: savedUser._id },
      { name: 'Updated Name' }
    );

    // ASSERT: Verify update
    const updatedUser = await manager.findOne('User', { where: { _id: savedUser._id } });
    expect(updatedUser.name).toBe('Updated Name');
  });

  test('should handle increment operations', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    // ACT: Increment age
    await manager.update('User',
      { _id: savedUser._id },
      { age: savedUser.age + 5 }
    );

    // ASSERT: Verify increment
    const updatedUser = await manager.findOne('User', { where: { _id: savedUser._id } });
    expect(updatedUser.age).toBe(savedUser.age + 5);
  });

  test('should handle array operations', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    // ACT: Add tag to array
    const updatedTags = [...(savedUser.tags || []), 'tag2'];
    await manager.update('User',
      { _id: savedUser._id },
      { tags: updatedTags }
    );

    // ASSERT: Verify array addition
    const updatedUser = await manager.findOne('User', { where: { _id: savedUser._id } });
    expect(updatedUser.tags).toContain('tag2');

    // ACT: Remove tag from array
    const filteredTags = updatedUser.tags.filter(tag => tag !== 'tag1');
    await manager.update('User',
      { _id: savedUser._id },
      { tags: filteredTags }
    );

    // ASSERT: Verify array removal
    const finalUser = await manager.findOne('User', { where: { _id: savedUser._id } });
    expect(finalUser.tags).not.toContain('tag1');
    expect(finalUser.tags).toContain('tag2');
  });

  test('should handle multiple updates', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    // Create multiple users
    const users = TestDataFactory.createUsers(3, { age: 25 });
    await manager.save('User', users);

    // ACT: Update multiple documents
    await manager.update('User',
      { age: { $lt: 30 } },
      { category: 'young' }
    );

    // ASSERT: Verify multiple updates
    const youngUsers = await manager.find('User', { where: { category: 'young' } });
    expect(youngUsers).toHaveLength(1);
    expect(youngUsers[0].age).toBeLessThan(30);
  });

  test('should use array modification operators', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    const documentData = TestDataFactory.createDocument(savedUser._id, savedFolder._id, {
      tags: ['initial']
    });
    const savedDocument = await manager.save('Document', documentData);

    // ACT: Add tag to array
    const updatedTags = [...savedDocument.tags, 'new-tag'];
    await manager.update('Document',
      { _id: savedDocument._id },
      { tags: updatedTags }
    );

    // ASSERT: Verify array addition
    const updatedDocument = await manager.findOne('Document', { 
      where: { _id: savedDocument._id } 
    });
    expect(updatedDocument.tags).toContain('new-tag');

    // ACT: Remove tag from array
    const filteredTags = updatedDocument.tags.filter(tag => tag !== 'initial');
    await manager.update('Document',
      { _id: savedDocument._id },
      { tags: filteredTags }
    );

    // ASSERT: Verify array removal
    const finalDocument = await manager.findOne('Document', { 
      where: { _id: savedDocument._id } 
    });
    expect(finalDocument.tags).not.toContain('initial');
    expect(finalDocument.tags).toContain('new-tag');
  });

  test('should use numeric update operators', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    const documentData = TestDataFactory.createDocument(savedUser._id, savedFolder._id, {
      metadata: {
        fileSize: 1000,
        downloadCount: 5
      }
    });
    const savedDocument = await manager.save('Document', documentData);

    // ACT: Update numeric values
    await manager.update('Document',
      { _id: savedDocument._id },
      {
        metadata: {
          ...savedDocument.metadata,
          downloadCount: savedDocument.metadata.downloadCount + 1,
          fileSize: savedDocument.metadata.fileSize * 1.5
        }
      }
    );

    // ASSERT: Verify numeric updates
    const updatedDocument = await manager.findOne('Document', { 
      where: { _id: savedDocument._id } 
    });
    expect(updatedDocument.metadata.downloadCount).toBe(6);
    expect(updatedDocument.metadata.fileSize).toBe(1500);
  });

  test('should use field modification operators', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    const documentData = TestDataFactory.createDocument(savedUser._id, savedFolder._id, {
      metadata: {
        oldField: 'value'
      }
    });
    const savedDocument = await manager.save('Document', documentData);

    // ACT: Rename field
    const updatedMetadata = { ...savedDocument.metadata };
    updatedMetadata.newField = updatedMetadata.oldField;
    delete updatedMetadata.oldField;

    await manager.update('Document',
      { _id: savedDocument._id },
      { metadata: updatedMetadata }
    );

    // ASSERT: Verify field rename
    const updatedDocument = await manager.findOne('Document', { 
      where: { _id: savedDocument._id } 
    });
    expect(updatedDocument.metadata.newField).toBe('value');
    expect(updatedDocument.metadata.oldField).toBeUndefined();
  });

  test('should use conditional updates', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', savedUser._id);

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

    // ACT: Update only draft documents
    await manager.update('Document',
      { 'metadata.status': 'draft' },
      { 'metadata.status': 'in-progress' }
    );

    // ASSERT: Verify conditional update
    const updatedDocuments = await manager.find('Document', {
      where: { 'metadata.status': 'in-progress' }
    });
    expect(updatedDocuments).toHaveLength(2);

    const reviewDocuments = await manager.find('Document', {
      where: { 'metadata.status': 'review' }
    });
    expect(reviewDocuments).toHaveLength(3);
  });
}); 