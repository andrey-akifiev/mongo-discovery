import { test, expect } from './base-test';
import { ObjectId } from 'mongodb';
import { TestDataFactory } from '../../test-data-factory';
import { v4 as uuid } from 'uuid';

test.describe('MongoDB Update Operations with Mongoose', () => {
  test('should use array modification operators', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    const document = TestDataFactory.createDocument(testUserId, testFolderId, {
      tags: ['initial'],
      metadata: { status: 'draft' }
    });
    const doc = await DocumentModel.create(document);

    // ACT: Modify array using $push and $pull
    await DocumentModel.updateOne(
      { _id: doc._id },
      {
        $push: {
          tags: {
            $each: ['new', 'important'],
            $sort: 1
          }
        }
      }
    );

    await DocumentModel.updateOne(
      { _id: doc._id },
      {
        $pull: {
          tags: 'initial'
        }
      }
    );

    // ASSERT: Verify array modifications
    const updatedDoc = await DocumentModel.findById(doc._id);
    expect(updatedDoc?.tags).toContain('new');
    expect(updatedDoc?.tags).toContain('important');
    expect(updatedDoc?.tags).not.toContain('initial');
    expect(updatedDoc?.tags).toEqual(['important', 'new']); // Sorted alphabetically
  });

  test('should use numeric update operators', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    const document = TestDataFactory.createDocument(testUserId, testFolderId, {
      metadata: { 
        version: '1.0',
        fileSize: 1000,
        downloadCount: 0
      }
    });
    const doc = await DocumentModel.create(document);

    // ACT: Use numeric operators
    await DocumentModel.updateOne(
      { _id: doc.id },
      {
        $inc: { 'metadata.downloadCount': 1 },
        $mul: { 'metadata.fileSize': 1.5 }
      }
    );

    // ASSERT: Verify numeric updates
    const updatedDoc = await DocumentModel.findById(doc.id);
    expect(updatedDoc?.metadata?.downloadCount).toBe(1);
    expect(updatedDoc?.metadata?.fileSize).toBe(1500);
  });

  test('should use field modification operators', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    const document = TestDataFactory.createDocument(testUserId, testFolderId, {
      name: 'Document',
      metadata: { status: 'draft' }
    });
    const doc = await DocumentModel.create(document);

    // ACT: Use field modification operators
    const updateResult = await DocumentModel.updateMany(
      { _id: doc.id },
      {
        $set: { 'metadata.createdBy': testUserId }
      }
    );

    // ASSERT: Verify field modifications
    const updatedDoc = await DocumentModel.findById(doc.id);
    console.log('Updated document:', updatedDoc);
    expect(updatedDoc?.name).toBe('Document');
    expect(updatedDoc?.metadata?.createdBy).toStrictEqual(testUserId);
  });

  test('should use conditional updates', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'draft', version: '1.0' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'review', version: '1.0' }
      })
    ];
    await DocumentModel.insertMany(documents);

    // ACT: Perform conditional updates
    const updateResult = await DocumentModel.updateMany(
      {
        ownerId: testUserId,
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
    const updatedDocs = await DocumentModel.find({
      ownerId: testUserId,
      'metadata.status': 'review'
    });
    expect(updatedDocs.length).toBe(2);
  });
}); 