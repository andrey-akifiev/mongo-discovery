import { test, expect } from '@playwright/test';
import { MongoClient, ObjectId } from 'mongodb';
import { User, Folder, Document } from './interfaces';
import { TestDataFactory } from './test-data-factory';

test.describe('MongoDB Document Operations', () => {
  let client: MongoClient;
  let documentsCollection: any;
  let usersCollection: any;
  let foldersCollection: any;
  let testUserId: ObjectId;
  let testFolderId: ObjectId;

  test.beforeAll(async () => {
    // Connect to MongoDB with authentication
    client = new MongoClient('mongodb://root:example@localhost:27017/test?authSource=admin');
    await client.connect();
    
    documentsCollection = client.db('test').collection<Document>('documents');
    usersCollection = client.db('test').collection<User>('users');
    foldersCollection = client.db('test').collection<Folder>('folders');

    // Create test user and folder for document operations
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    testFolderId = folderResult.insertedId;
  });

  test.afterAll(async () => {
    // Clean up test data
    await usersCollection.deleteOne({ _id: testUserId });
    await foldersCollection.deleteOne({ _id: testFolderId });
    await client.close();
  });

  test('should create a new document', async () => {
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

    const result = await documentsCollection.insertOne(documentData);
    expect(result.acknowledged).toBe(true);
    expect(result.insertedId).toBeDefined();
  });

  test('should find documents by tags', async () => {
    // First create a document with specific tags
    const documentData = TestDataFactory.createDocument(testUserId, testFolderId, {
      tags: ['urgent', 'confidential']
    });
    await documentsCollection.insertOne(documentData);

    // Find documents with the 'urgent' tag
    const foundDocuments = await documentsCollection.find({ tags: 'urgent' }).toArray();
    expect(foundDocuments.length).toBeGreaterThan(0);
    expect(foundDocuments[0].tags).toContain('urgent');
  });

  test('should update document metadata', async () => {
    // First create a document
    const documentData = TestDataFactory.createDocument(testUserId, testFolderId, {
      metadata: {
        status: 'draft',
        version: '1.0'
      }
    });
    const insertResult = await documentsCollection.insertOne(documentData);

    // Update the document's metadata
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

    expect(updateResult.acknowledged).toBe(true);
    expect(updateResult.modifiedCount).toBe(1);

    // Verify the update
    const updatedDoc = await documentsCollection.findOne({ _id: insertResult.insertedId });
    expect(updatedDoc.metadata.status).toBe('review');
    expect(updatedDoc.metadata.version).toBe('1.1');
  });

  test('should delete a document', async () => {
    // First create a document
    const documentData = TestDataFactory.createDocument(testUserId, testFolderId);
    const insertResult = await documentsCollection.insertOne(documentData);

    // Delete the document
    const deleteResult = await documentsCollection.deleteOne({ _id: insertResult.insertedId });
    expect(deleteResult.acknowledged).toBe(true);
    expect(deleteResult.deletedCount).toBe(1);

    // Verify the deletion
    const deletedDoc = await documentsCollection.findOne({ _id: insertResult.insertedId });
    expect(deletedDoc).toBeNull();
  });
}); 