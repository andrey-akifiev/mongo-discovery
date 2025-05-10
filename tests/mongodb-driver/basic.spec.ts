import { test, expect } from './base-test';
import { ObjectId } from 'mongodb';
import { TestDataFactory } from '../../test-data-factory';
import { v4 as uuid } from 'uuid';

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

  test('should perform bulk insert operations', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Create multiple documents
    const documents = Array.from({ length: 5 }, () => 
      TestDataFactory.createDocument(testUserId, testFolderId, {
        tags: ['bulk', 'test'],
        metadata: {
          status: 'draft',
          version: '1.0'
        }
      })
    );

    // ACT: Perform bulk insert
    const result = await documentsCollection.insertMany(documents);

    // ASSERT: Verify bulk insertion
    expect(result.acknowledged).toBe(true);
    expect(result.insertedCount).toBe(5);
    expect(Object.keys(result.insertedIds).length).toBe(5);
  });

  test('should find documents using complex query with multiple conditions', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Create documents with different statuses and tags
    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        tags: ['urgent', 'confidential'],
        metadata: { status: 'draft', version: '1.0' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        tags: ['urgent', 'public'],
        metadata: { status: 'review', version: '1.0' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        tags: ['normal', 'confidential'],
        metadata: { status: 'draft', version: '1.0' }
      })
    ];
    await documentsCollection.insertMany(documents);

    // ACT: Find documents with complex conditions
    const foundDocuments = await documentsCollection.find({
      $and: [
        { tags: 'urgent' },
        { 'metadata.status': 'draft' }
      ]
    }).toArray();

    // ASSERT: Verify the search results
    expect(foundDocuments.length).toBeGreaterThanOrEqual(1);
    foundDocuments.forEach(doc => {
      expect(doc.tags).toContain('urgent');
      expect(doc.metadata?.status).toBe('draft');
    });
  });

  test('should perform aggregation to count documents by status', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const expectedStatus = uuid();
    
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Create documents with different statuses
    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: expectedStatus, version: '1.0' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: expectedStatus, version: '1.0' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'review', version: '1.0' }
      })
    ];
    await documentsCollection.insertMany(documents);

    // ACT: Perform aggregation
    const result = await documentsCollection.aggregate([
      { $group: { _id: '$metadata.status', count: { $sum: 1 } } }
    ]).toArray();

    // ASSERT: Verify aggregation results
    const draftCount = result.find(r => r._id === expectedStatus)?.count ?? 0;
    expect(draftCount).toBe(2);
  });

  test('should handle duplicate key errors', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Create a document with a specific name
    const documentData = TestDataFactory.createDocument(testUserId, testFolderId, {
      name: 'unique-document'
    });
    await documentsCollection.insertOne(documentData);

    // ACT & ASSERT: Attempt to insert document with same name
    await expect(documentsCollection.insertOne({
      ...TestDataFactory.createDocument(testUserId, testFolderId, {
        name: 'unique-document'
      })
    })).rejects.toThrow();
  });

  test('should update multiple documents matching criteria', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Create multiple documents with same status
    const documents = Array.from({ length: 3 }, () => 
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'draft', version: '1.0' }
      })
    );
    await documentsCollection.insertMany(documents);

    const expectedCount = await documentsCollection
      .find({ 'metadata.status': 'draft', 'ownerId': testUserId })
      .count();

    // ACT: Update all matching documents
    const updateResult = await documentsCollection
      .updateMany(
        { 
          'ownerId': testUserId,
          'metadata.status': 'draft'
        },
        { 
          $set: { 
            'metadata.status': 'review',
            'metadata.version': '1.1',
            updatedAt: new Date()
          }
        });

    // ASSERT: Verify the update operation
    expect(updateResult.acknowledged).toBe(true);
    expect(updateResult.modifiedCount).toBe(expectedCount);

    // ASSERT: Verify all documents were updated
    const updatedDocs = await documentsCollection
      .find({ 'metadata.status': 'review', 'ownerId': testUserId })
      .toArray();
    updatedDocs.forEach(doc => {
      expect(doc.metadata?.status).toBe('review');
      expect(doc.metadata?.version).toBe('1.1');
    });
  });

  test('should perform text search on document content', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Create text index
    await documentsCollection.createIndex({ content: 'text' });

    // Create documents with different content
    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        content: 'This is a test document about MongoDB',
        metadata: { status: 'draft' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        content: 'Another document about testing',
        metadata: { status: 'draft' }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        content: 'Unrelated content',
        metadata: { status: 'draft' }
      })
    ];
    await documentsCollection.insertMany(documents);

    // ACT: Perform text search
    const searchResults = await documentsCollection.find(
      { $text: { $search: 'MongoDB testing' } }
    ).toArray();

    // ASSERT: Verify search results
    expect(searchResults.some(doc => doc.content?.includes('MongoDB'))).toBe(true);
    expect(searchResults.some(doc => doc.content?.includes('testing'))).toBe(true);
  });

  test('should perform geospatial queries', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Create geospatial index
    await documentsCollection.createIndex({ location: '2dsphere' });

    // Create documents with locations (coordinates in [longitude, latitude] order)
    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        name: 'Nearby Document',
        location: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128] // New York [longitude, latitude]
        }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        name: 'Far Document',
        location: {
          type: 'Point',
          coordinates: [-118.2437, 34.0522] // Los Angeles [longitude, latitude]
        }
      })
    ];
    await documentsCollection.insertMany(documents);

    // ACT: Find documents within 100km of New York
    const nearbyDocs = await documentsCollection.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [-74.0060, 40.7128] // New York [longitude, latitude]
          },
          $maxDistance: 100000 // 100km in meters
        }
      }
    }).toArray();

    // ASSERT: Verify geospatial query results
    expect(nearbyDocs.length).toBeGreaterThanOrEqual(1);
    nearbyDocs.forEach(doc => {
      expect(doc.name).toBe('Nearby Document');
    });
  });

  test('should use indexes for efficient querying', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Create compound index
    await documentsCollection.createIndex({ 
      'metadata.status': 1, 
      'metadata.version': 1 
    });

    // Create documents with different statuses and versions
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

    // ACT: Query using indexed fields
    const explain = await documentsCollection.find({
      'metadata.status': 'draft',
      'metadata.version': '1.0'
    }).explain('executionStats');

    // ASSERT: Verify index usage
    expect(explain.queryPlanner.winningPlan.inputStage.indexName).toBe('metadata.status_1_metadata.version_1');
  });

  test('should perform complex aggregation pipeline', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // Create documents with various metadata
    const documents = [
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'draft', version: '1.0', fileSize: 1000 }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'draft', version: '1.1', fileSize: 2000 }
      }),
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'review', version: '1.0', fileSize: 1500 }
      })
    ];
    await documentsCollection.insertMany(documents);

    // ACT: Perform complex aggregation
    const result = await documentsCollection.aggregate([
      // Match documents
      { $match: { 'metadata.status': { $in: ['draft', 'review'] }, 'ownerId': testUserId } },
      // Group by status and version
      { 
        $group: {
          _id: {
            status: '$metadata.status',
            version: '$metadata.version'
          },
          count: { $sum: 1 },
          totalSize: { $sum: '$metadata.fileSize' },
          avgSize: { $avg: '$metadata.fileSize' }
        }
      },
      // Sort by count
      { $sort: { count: -1 } }
    ]).toArray();

    // ASSERT: Verify aggregation results
    expect(result.length).toBe(3);
    expect(result[0].count).toBeDefined();
    expect(result[0].totalSize).toBeDefined();
    expect(result[0].avgSize).toBeDefined();
  });

  test('should validate document schema', async ({ documentsCollection, usersCollection, foldersCollection }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const userResult = await usersCollection.insertOne(userData);
    const testUserId = userResult.insertedId;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folderResult = await foldersCollection.insertOne(folderData);
    const testFolderId = folderResult.insertedId;

    // ACT & ASSERT: Attempt to insert invalid document
    await expect(documentsCollection.insertOne({
      _id: new ObjectId(),
      userId: testUserId,
      folderId: testFolderId,
      // Missing required fields
      createdAt: new Date(),
      updatedAt: new Date()
    })).rejects.toThrow();
  });

  test(
    'should use cursor for large result sets',
    async ({ documentsCollection, usersCollection, foldersCollection }) => {
      // ARRANGE: Create test user and folder
      const batchSize = 10;
      
      const userData = TestDataFactory.createUser();
      const userResult = await usersCollection.insertOne(userData);
      const testUserId = userResult.insertedId;

      const folderData = TestDataFactory.createFolder(testUserId);
      const folderResult = await foldersCollection.insertOne(folderData);
      const testFolderId = folderResult.insertedId;

      // Create multiple documents
      const documents = Array.from({ length: 100 }, (_, i) => 
        TestDataFactory.createDocument(testUserId, testFolderId, {
          name: `Document ${i}`,
          metadata: { status: 'draft', version: '1.0' }
        })
      );
      await documentsCollection.insertMany(documents);

      // ACT: Use cursor to process documents
      const cursor = documentsCollection.find({}).batchSize(batchSize);
      const processedDocs: any[] = [];

      let iterations = 0;
      for await (const doc of cursor) {
        processedDocs.push(doc);
      }

      const count = await documentsCollection.countDocuments();
      expect(processedDocs.length).toBe(count);
  });
}); 