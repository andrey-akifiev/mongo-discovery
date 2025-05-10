import { test, expect } from './base-test';
import { ObjectId } from 'mongodb';
import { TestDataFactory } from '../../test-data-factory';

test.describe('MongoDB Document Operations', () => {
  test('should create a new document', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    const documentData = TestDataFactory.createDocument(testUserId, testFolderId, {
      tags: ['test', 'important'],
      metadata: {
        fileSize: 1024,
        fileType: 'txt',
        lastModified: new Date(),
        version: '1.0',
        status: 'draft'
      }
    });

    // ACT: Insert the document
    const result = await documentsCollection.insertOne(documentData);

    // ASSERT: Verify the insertion
    expect(result.acknowledged).toBe(true);
    expect(result.insertedId).toBeDefined();
  });

  test('should find documents by tags', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Create a document with specific tags
    const documentData = TestDataFactory.createDocument(testUserId, testFolderId, {
      tags: ['urgent', 'confidential']
    });
    await documentsCollection.insertOne(documentData);

    // ACT: Find documents with the 'urgent' tag
    const foundDocuments = await documentsCollection.find({ tags: 'urgent' }).toArray();

    // ASSERT: Verify the search results
    expect(foundDocuments.length).toBeGreaterThan(0);
    expect(foundDocuments[0].tags).toContain('urgent');
  });

  test('should update document metadata', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Create a document with initial metadata
    const documentData = TestDataFactory.createDocument(testUserId, testFolderId, {
      metadata: {
        status: 'draft',
        version: '1.0'
      }
    });
    const insertResult = await documentsCollection.insertOne(documentData);

    // ACT: Update the document's metadata
    const updateResult = await documentsCollection.updateOne(
      { _id: insertResult.insertedId },
      { 
        $set: { 
          'metadata.status': 'review',
          'metadata.version': '1.1',
          updatedAt: new Date()
        }
      }
    );

    // ASSERT: Verify the update operation
    expect(updateResult.acknowledged).toBe(true);
    expect(updateResult.modifiedCount).toBe(1);

    // ASSERT: Verify the updated document
    const updatedDoc = await documentsCollection.findOne({ _id: insertResult.insertedId });
    expect(updatedDoc?.metadata?.status).toBe('review');
    expect(updatedDoc?.metadata?.version).toBe('1.1');
  });

  test('should delete a document', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Create a document to delete
    const documentData = TestDataFactory.createDocument(testUserId, testFolderId);
    const insertResult = await documentsCollection.insertOne(documentData);

    // ACT: Delete the document
    const deleteResult = await documentsCollection.deleteOne({ _id: insertResult.insertedId });

    // ASSERT: Verify the deletion operation
    expect(deleteResult.acknowledged).toBe(true);
    expect(deleteResult.deletedCount).toBe(1);

    // ASSERT: Verify the document no longer exists
    const deletedDoc = await documentsCollection.findOne({ _id: insertResult.insertedId });
    expect(deletedDoc).toBeNull();
  });
}); 