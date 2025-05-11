import { test, expect } from './base-test';
import { TestDataFactory } from './test-data-factory';

test.describe('Prisma Document Operations', () => {
  test('should create a new document', async ({ prisma }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({
      data: userData
    });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({
      data: folderData
    });

    const documentData = TestDataFactory.createDocument(user.id, folder.id, {
      tags: ['test', 'important'],
      metadata: {
        fileSize: 1024,
        fileType: 'txt',
        lastModified: new Date().toISOString(),
        version: '1.0',
        status: 'draft'
      } as any
    });

    // ACT: Insert the document
    const document = await prisma.document.create({
      data: documentData
    });

    // ASSERT: Verify the insertion
    expect(document).toBeDefined();
    expect(document.id).toBeDefined();
  });

  test('should find documents by tags', async ({ prisma }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({
      data: userData
    });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({
      data: folderData
    });

    // Create a document with specific tags
    const documentData = TestDataFactory.createDocument(user.id, folder.id, {
      tags: ['urgent', 'confidential']
    });
    await prisma.document.create({
      data: documentData
    });

    // ACT: Find documents with the 'urgent' tag
    const foundDocuments = await prisma.document.findMany({
      where: {
        tags: {
          has: 'urgent'
        }
      }
    });

    // ASSERT: Verify the search results
    expect(foundDocuments.length).toBeGreaterThan(0);
    expect(foundDocuments[0].tags).toContain('urgent');
  });

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
      } as any
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
        } as any,
        updatedAt: new Date()
      }
    });

    // ASSERT: Verify the updated document
    const metadata = updatedDocument.metadata as any;
    expect(metadata.status).toBe('review');
    expect(metadata.version).toBe('1.1');
  });

  test('should delete a document', async ({ prisma }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({
      data: userData
    });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({
      data: folderData
    });

    // Create a document to delete
    const documentData = TestDataFactory.createDocument(user.id, folder.id);
    const document = await prisma.document.create({
      data: documentData
    });

    // ACT: Delete the document
    await prisma.document.delete({
      where: { id: document.id }
    });

    // ASSERT: Verify the document no longer exists
    const deletedDoc = await prisma.document.findUnique({
      where: { id: document.id }
    });
    expect(deletedDoc).toBeNull();
  });

  test('should perform bulk insert operations', async ({ prisma }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({
      data: userData
    });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({
      data: folderData
    });

    // Create multiple documents
    const documents = Array.from({ length: 5 }, () => {
      const doc = TestDataFactory.createDocument(user.id, folder.id, {
        tags: ['bulk', 'test'],
        metadata: {
          status: 'draft',
          version: '1.0'
        } as any
      });
      return stripRelations(doc, user.id, folder.id);
    });

    // ACT: Perform bulk insert
    const createdDocuments = await prisma.document.createMany({
      data: documents
    });

    // ASSERT: Verify bulk insertion
    expect(createdDocuments.count).toBe(5);
  });

  test('should find documents using complex query with multiple conditions', async ({ prisma }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await prisma.user.create({
      data: userData
    });

    const folderData = TestDataFactory.createFolder(user.id);
    const folder = await prisma.folder.create({
      data: folderData
    });

    // Create documents with different statuses and tags
    const documents = [
      TestDataFactory.createDocument(user.id, folder.id, {
        tags: ['urgent', 'confidential'],
        metadata: { status: 'draft', version: '1.0' } as any
      }),
      TestDataFactory.createDocument(user.id, folder.id, {
        tags: ['urgent', 'public'],
        metadata: { status: 'review', version: '1.0' } as any
      }),
      TestDataFactory.createDocument(user.id, folder.id, {
        tags: ['normal', 'confidential'],
        metadata: { status: 'draft', version: '1.0' } as any
      })
    ].map(doc => stripRelations(doc, user.id, folder.id));

    await prisma.document.createMany({
      data: documents
    });

    // ACT: Find documents with complex conditions
    const foundDocuments = await prisma.document.findMany({
      where: {
        AND: [
          { tags: { has: 'urgent' } },
          { metadata: { equals: { status: 'draft' } } }
        ]
      }
    });

    // ASSERT: Verify the search results
    expect(foundDocuments.length).toBeGreaterThanOrEqual(1);
    foundDocuments.forEach(doc => {
      expect(doc.tags).toContain('urgent');
      const metadata = doc.metadata as any;
      expect(metadata.status).toBe('draft');
    });
  });
});

// Utility to strip nested relations for createMany
function stripRelations(doc: any, userId: string, folderId: string) {
  const { owner, folder, ...rest } = doc;
  return {
    ...rest,
    ownerId: userId,
    folderId: folderId
  };
} 