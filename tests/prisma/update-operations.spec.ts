import { test, expect } from './base-test';
import { TestDataFactory } from './test-data-factory';

test.describe('Prisma Update Operations', () => {
  test('should update document metadata', async ({ prisma }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({
      data: userData
    });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({
      data: folderData
    });

    // Create a document with initial metadata
    const documentData = TestDataFactory.createDocument(user.id, folder.id, {
      metadata: {
        status: 'draft',
        version: '1.0'
      }
    });
    const document = await prisma.document.create({
      data: documentData
    });

    // ACT: Update the document's metadata
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: {
        metadata: {
          status: 'review',
          version: '1.1'
        },
        updatedAt: new Date()
      }
    });

    // ASSERT: Verify the updated document
    expect(updatedDocument.metadata).toEqual({
      status: 'review',
      version: '1.1'
    });
  });

  test('should update document tags', async ({ prisma }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({
      data: userData
    });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({
      data: folderData
    });

    // Create a document with initial tags
    const documentData = TestDataFactory.createDocument(user.id, folder.id, {
      tags: ['initial', 'test']
    });
    const document = await prisma.document.create({
      data: documentData
    });

    // ACT: Update the document's tags
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: {
        tags: ['updated', 'important'],
        updatedAt: new Date()
      }
    });

    // ASSERT: Verify the updated document
    expect(updatedDocument.tags).toEqual(['updated', 'important']);
  });

  test('should update document content', async ({ prisma }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({
      data: userData
    });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({
      data: folderData
    });

    // Create a document with initial content
    const documentData = TestDataFactory.createDocument(user.id, folder.id, {
      content: 'Initial content'
    });
    const document = await prisma.document.create({
      data: documentData
    });

    // ACT: Update the document's content
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: {
        content: 'Updated content',
        updatedAt: new Date()
      }
    });

    // ASSERT: Verify the updated document
    expect(updatedDocument.content).toBe('Updated content');
  });

  test('should update document location', async ({ prisma }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({
      data: userData
    });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({
      data: folderData
    });

    // Create a document with initial location
    const documentData = TestDataFactory.createDocument(user.id, folder.id, {
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });
    const document = await prisma.document.create({
      data: documentData
    });

    // ACT: Update the document's location
    const newLocation = {
      type: 'Point',
      coordinates: [45, 45]
    };
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: {
        location: newLocation,
        updatedAt: new Date()
      }
    });

    // ASSERT: Verify the updated document
    expect(updatedDocument.location).toEqual(newLocation);
  });

  test('should update document last accessed time', async ({ prisma }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({
      data: userData
    });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({
      data: folderData
    });

    // Create a document
    const documentData = TestDataFactory.createDocument(user.id, folder.id);
    const document = await prisma.document.create({
      data: documentData
    });

    // ACT: Update the document's last accessed time
    const lastAccessed = new Date();
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: {
        lastAccessed,
        updatedAt: new Date()
      }
    });

    // ASSERT: Verify the updated document
    expect(updatedDocument.lastAccessed).toEqual(lastAccessed);
  });
}); 