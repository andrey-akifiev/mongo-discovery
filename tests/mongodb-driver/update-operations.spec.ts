import { test, expect } from './base-test';
import { ObjectId } from 'mongodb';
import { TestDataFactory } from '../../test-data-factory';
import { v4 as uuid } from 'uuid';

test.describe('MongoDB Update Operations', () => {
  test('should use array modification operators', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    const document = TestDataFactory.createDocument(testUserId, testFolderId, {
      tags: ['initial'],
      metadata: { status: 'draft' }
    });
    const insertResult = await documentsCollection.insertOne(document);

    // ACT: Modify array using $push and $pull
    await documentsCollection.updateOne(
      { _id: insertResult.insertedId },
      {
        $push: {
          tags: {
            $each: ['new', 'important'],
            $sort: 1
          }
        }
      }
    );

    await documentsCollection.updateOne(
      { _id: insertResult.insertedId },
      {
        $pull: {
          tags: 'initial'
        }
      }
    );

    // ASSERT: Verify array modifications
    const updatedDoc = await documentsCollection.findOne({ _id: insertResult.insertedId });
    expect(updatedDoc?.tags).toContain('new');
    expect(updatedDoc?.tags).toContain('important');
    expect(updatedDoc?.tags).not.toContain('initial');
    expect(updatedDoc?.tags).toEqual(['important', 'new']); // Sorted alphabetically
  });

  test('should use numeric update operators', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    const document = TestDataFactory.createDocument(testUserId, testFolderId, {
      metadata: { 
        version: 1,
        fileSize: 1000,
        downloadCount: 0
      }
    });
    const insertResult = await documentsCollection.insertOne(document);

    // ACT: Use numeric operators
    await documentsCollection.updateOne(
      { _id: insertResult.insertedId },
      {
        $inc: { 'metadata.downloadCount': 1 },
        $mul: { 'metadata.fileSize': 1.5 }
      }
    );

    // ASSERT: Verify numeric updates
    const updatedDoc = await documentsCollection.findOne({ _id: insertResult.insertedId });
    expect(updatedDoc?.metadata?.downloadCount).toBe(1);
    expect(updatedDoc?.metadata?.fileSize).toBe(1500);
  });

  test('should use field modification operators', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    const document = TestDataFactory.createDocument(testUserId, testFolderId, {
      oldName: 'Document',
      metadata: { status: 'draft' }
    });
    const insertResult = await documentsCollection.insertOne(document);

    // ACT: Use field modification operators
    await documentsCollection.updateOne(
      { _id: insertResult.insertedId },
      {
        $rename: { 'oldName': 'name' },
        $setOnInsert: { 'metadata.createdBy': testUserId }
      },
      { upsert: true }
    );

    // ASSERT: Verify field modifications
    const updatedDoc = await documentsCollection.findOne({ _id: insertResult.insertedId });
    expect(updatedDoc?.name).toBe('Document');
    expect(updatedDoc?.oldName).toBeUndefined();
  });

  test('should use conditional updates', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'draft', version: '1.0' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'review', version: '1.0' }
      })
    ];
    await documentsCollection.insertMany(documents);

    // ACT: Perform conditional updates
    const updateResult = await documentsCollection.updateMany(
      {
        'ownerId': testUserId,
        'metadata.status': 'draft',
        'metadata.version': '1.0'
      },
      [
        {
          $set: {
            'metadata.status': {
              $cond: {
                if: { $eq: ['$metadata.version', '1.0'] },
                then: 'review',
                else: '$metadata.status'
              }
            }
          }
        }
      ]
    );

    // ASSERT: Verify conditional updates
    expect(updateResult.modifiedCount).toBe(1);
    const updatedDocs = await documentsCollection
      .find({ 'ownerId': testUserId, 'metadata.status': 'review' })
      .toArray();
    expect(updatedDocs.length).toBe(2);
  });
}); 