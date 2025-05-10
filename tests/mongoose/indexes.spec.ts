import { test, expect } from './base-test';
import { ObjectId } from 'mongodb';
import { TestDataFactory } from '../../test-data-factory';
import { v4 as uuid } from 'uuid';

test.describe('MongoDB Index Operations with Mongoose', () => {
  test('should create and use compound indexes', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    // Create compound index at schema level
    DocumentModel.schema.index(
      { 
        'metadata.status': 1,
        'metadata.version': 1,
        createdAt: -1
      },
      { name: 'status_version_created' }
    );

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
    await DocumentModel.insertMany(documents);

    // ACT: Query using compound index
    const explain = await DocumentModel.collection.find({
      'metadata.status': 'draft',
      'metadata.version': '1.0'
    }).sort({ createdAt: -1 }).explain('executionStats');

    // ASSERT: Verify index usage
    expect(explain.queryPlanner.winningPlan.inputStage.indexName).toBe('status_version_created');
  });

  test('should create and use sparse indexes', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    // Create sparse index at schema level
    DocumentModel.schema.index(
      { 'metadata.priority': 1 },
      { sparse: true, name: 'metadata.priority_1' }
    );

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
    await DocumentModel.insertMany(documents);

    // ACT: Query using sparse index
    const explain = await DocumentModel.collection.find({
      'metadata.priority': 'high'
    }).explain('executionStats');

    // ASSERT: Verify index usage
    expect(explain.queryPlanner.winningPlan.inputStage.indexName).toBe('metadata.priority_1');
  });

  test('should create and use TTL indexes', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    // Create TTL index at schema level
    DocumentModel.schema.index(
      { 'metadata.expiresAt': 1 },
      { expireAfterSeconds: 0, name: 'metadata.expiresAt_1' }
    );

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
    await DocumentModel.insertMany(documents);

    // ACT: Wait for TTL to take effect
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ASSERT: Verify TTL deletion
    const remainingDocs = await DocumentModel.find({
      ownerId: testUserId,
      'metadata.status': testStatus
    });
    expect(remainingDocs.length).toBeLessThan(2);
  });
}); 