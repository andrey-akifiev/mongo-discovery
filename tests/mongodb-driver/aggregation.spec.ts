import { test, expect } from './base-test';
import { ObjectId } from 'mongodb';
import { TestDataFactory } from '../../test-data-factory';
import { v4 as uuid } from 'uuid';

test.describe('MongoDB Advanced Aggregation Operations', () => {
  test('should perform $lookup to join collections', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        name: 'Doc 1',
        metadata: { status: 'draft', version: '1.0' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        name: 'Doc 2',
        metadata: { status: 'review', version: '1.0' }
      })
    ];
    await documentsCollection.insertMany(documents);

    // ACT: Perform aggregation with $lookup
    const result = await documentsCollection.aggregate([
      {
        $match: {
          ownerId: testUserId
        }
      },
      {
        $lookup: {
          from: 'folders',
          localField: 'folderId',
          foreignField: '_id',
          as: 'folder'
        }
      },
      {
        $unwind: '$folder'
      },
      {
        $project: {
          documentName: '$name',
          folderName: '$folder.name',
          status: '$metadata.status'
        }
      }
    ]).toArray();

    // ASSERT: Verify join results
    expect(result.length).toBe(2);
    result.forEach(doc => {
      expect(doc.folderName).toBeDefined();
      expect(doc.documentName).toBeDefined();
      expect(doc.status).toBeDefined();
    });
  });

  test('should use $facet for multiple aggregation pipelines', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    const status1 = uuid();
    const status2 = uuid();

    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: status1, version: '1.0', fileSize: 1000 }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: status1, version: '1.1', fileSize: 2000 }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: status2, version: '1.0', fileSize: 1500 }
      })
    ];
    await documentsCollection.insertMany(documents);

    // ACT: Perform aggregation with $facet
    const result = await documentsCollection.aggregate([
      {
        $match: {
          ownerId: testUserId
        }
      },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$metadata.status', count: { $sum: 1 } } }
          ],
          sizeStats: [
            { $group: { 
              _id: null,
              avgSize: { $avg: '$metadata.fileSize' },
              totalSize: { $sum: '$metadata.fileSize' }
            }}
          ],
          versionDistribution: [
            { $group: { _id: '$metadata.version', count: { $sum: 1 } } }
          ]
        }
      }
    ]).toArray();

    // ASSERT: Verify facet results
    expect(result[0].statusCounts.length).toBe(2);
    expect(result[0].sizeStats[0].avgSize).toBeDefined();
    expect(result[0].versionDistribution.length).toBe(2);
  });

  test('should use $unwind for array operations', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        tags: ['urgent', 'confidential', 'review'],
        metadata: { status: 'draft' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        tags: ['normal', 'public'],
        metadata: { status: 'draft' }
      })
    ];
    await documentsCollection.insertMany(documents);

    // ACT: Perform aggregation with $unwind
    const result = await documentsCollection.aggregate([
      {
        $match: {
          ownerId: testUserId
        }
      },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // ASSERT: Verify array operation results
    expect(result.length).toBe(5); // Total unique tags
    expect(result[0].count).toBeGreaterThanOrEqual(1);
  });

  test('should use $addFields for computed fields', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test data
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'draft', fileSize: 1000 }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'draft', fileSize: 2000 }
      })
    ];
    await documentsCollection.insertMany(documents);

    // ACT: Perform aggregation with $addFields
    const result = await documentsCollection.aggregate([
      {
        $match: {
          ownerId: testUserId
        }
      },
      {
        $addFields: {
          'metadata.sizeInMB': { $divide: ['$metadata.fileSize', 1024 * 1024] },
          'metadata.isLarge': { $gt: ['$metadata.fileSize', 1500] }
        }
      }
    ]).toArray();

    // ASSERT: Verify computed fields
    result.forEach(doc => {
      expect(doc.metadata?.sizeInMB).toBeDefined();
      expect(typeof doc.metadata?.isLarge).toBe('boolean');
    });
  });
}); 