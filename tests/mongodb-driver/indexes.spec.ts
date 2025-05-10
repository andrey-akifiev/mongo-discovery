import { test, expect } from './base-test';
import { ObjectId } from 'mongodb';
import { TestDataFactory } from '../../test-data-factory';
import { v4 as uuid } from 'uuid';

test.describe('MongoDB Index Operations', () => {
  test('should create and use compound indexes', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Check if index exists before creating
    const existingIndexes = await documentsCollection.indexes();
    const indexName = 'status_version_created';
    const indexExists = existingIndexes.some(index => index.name === indexName);

    if (!indexExists) {
      // Create compound index
      await documentsCollection.createIndex(
        { 
          'metadata.status': 1,
          'metadata.version': 1,
          createdAt: -1
        },
        { name: indexName }
      );
    }

    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'draft', version: '1.0' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'draft', version: '1.1' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'review', version: '1.0' }
      })
    ];
    await documentsCollection.insertMany(documents);

    // ACT: Query using compound index
    const explain = await documentsCollection.find({
      'metadata.status': 'draft',
      'metadata.version': '1.0'
    }).sort({ createdAt: -1 }).explain('executionStats');

    // ASSERT: Verify index usage
    expect(explain.queryPlanner.winningPlan.inputStage.indexName).toBe(indexName);
  });

  test('should create and use sparse indexes', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Check if index exists before creating
    const existingIndexes = await documentsCollection.indexes();
    const indexName = 'metadata.priority_1';
    const indexExists = existingIndexes.some(index => index.name === indexName);

    if (!indexExists) {
      // Create sparse index
      await documentsCollection.createIndex(
        { 'metadata.priority': 1 },
        { sparse: true }
      );
    }

    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { priority: 'high' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'draft' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { priority: 'low' }
      })
    ];
    await documentsCollection.insertMany(documents);

    // ACT: Query using sparse index
    const explain = await documentsCollection.find({
      'metadata.priority': 'high'
    }).explain('executionStats');

    // ASSERT: Verify index usage
    expect(explain.queryPlanner.winningPlan.inputStage.indexName).toBe(indexName);
  });

  test('should create and use TTL indexes', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Check if index exists before creating
    const existingIndexes = await documentsCollection.indexes();
    const indexName = 'metadata.expiresAt_1';
    const indexExists = existingIndexes.some(index => index.name === indexName);

    if (!indexExists) {
      // Create TTL index
      await documentsCollection.createIndex(
        { 'metadata.expiresAt': 1 },
        { expireAfterSeconds: 0, name: indexName }
      );
    }

    // Create a unique status for this test to avoid conflicts
    const testStatus = `temporary_${uuid()}`;

    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { 
          expiresAt: new Date(Date.now() + 1000), // Expires in 1 second
          status: testStatus
        }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { 
          expiresAt: new Date(Date.now() + 5000), // Expires in 5 seconds
          status: testStatus
        }
      })
    ];
    await documentsCollection.insertMany(documents);

    // ACT: Wait for TTL to take effect
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ASSERT: Verify TTL deletion
    const remainingDocs = await documentsCollection.find({
      'ownerId': testUserId,
      'metadata.status': testStatus
    }).toArray();
    expect(remainingDocs.length).toBeLessThan(2);
  });
}); 