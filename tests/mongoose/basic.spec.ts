import { test, expect } from './base-test';
import { ObjectId } from 'mongodb';
import { TestDataFactory } from '../../test-data-factory';
import { v4 as uuid } from 'uuid';

test.describe('MongoDB Basic Operations with Mongoose', () => {
  test('should create a new document', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

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
    const result = await DocumentModel.create(documentData);

    // ASSERT: Verify the insertion
    expect(result._id).toBeDefined();
    expect(result.name).toBe(documentData.name);
    expect(result.tags).toEqual(documentData.tags);
  });

  test('should find documents by tags', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    // Create a document with specific tags
    const documentData = TestDataFactory.createDocument(testUserId, testFolderId, {
      tags: ['urgent', 'confidential']
    });
    await DocumentModel.create(documentData);

    // ACT: Find documents with the 'urgent' tag
    const foundDocuments = await DocumentModel.find({ 
      ownerId: testUserId,
      tags: 'urgent' 
    });

    // ASSERT: Verify the search results
    expect(foundDocuments.length).toBeGreaterThan(0);
    expect(foundDocuments[0].tags).toContain('urgent');
  });

  test('should update document metadata', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    // Create a document with initial metadata
    const documentData = TestDataFactory.createDocument(testUserId, testFolderId, {
      metadata: {
        status: 'draft',
        version: '1.0'
      }
    });
    const doc = await DocumentModel.create(documentData);

    // ACT: Update the document's metadata
    const updateResult = await DocumentModel.updateOne(
      { _id: doc._id },
      { 
        $set: { 
          'metadata.status': 'review',
          'metadata.version': '1.1',
          updatedAt: new Date()
        }
      }
    );

    // ASSERT: Verify the update operation
    expect(updateResult.modifiedCount).toBe(1);

    // ASSERT: Verify the updated document
    const updatedDoc = await DocumentModel.findById(doc._id);
    expect(updatedDoc?.metadata?.status).toBe('review');
    expect(updatedDoc?.metadata?.version).toBe('1.1');
  });

  test('should delete a document', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    // Create a document to delete
    const documentData = TestDataFactory.createDocument(testUserId, testFolderId);
    const doc = await DocumentModel.create(documentData);

    // ACT: Delete the document
    const deleteResult = await DocumentModel.deleteOne({ _id: doc.id });

    // ASSERT: Verify the deletion operation
    expect(deleteResult.deletedCount).toBe(1);

    // ASSERT: Verify the document no longer exists
    const deletedDoc = await DocumentModel.findById(doc.id);
    expect(deletedDoc).toBeNull();
  });

  test('should perform bulk insert operations', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

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
    const result = await DocumentModel.insertMany(documents);

    // ASSERT: Verify bulk insertion
    expect(result.length).toBe(5);
    result.forEach(doc => {
      expect(doc._id).toBeDefined();
      expect(doc.tags).toContain('bulk');
    });
  });

  test('should find documents using complex query with multiple conditions', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

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
    await DocumentModel.insertMany(documents);

    // ACT: Find documents with complex conditions
    const foundDocuments = await DocumentModel.find({
      ownerId: testUserId,
      $and: [
        { tags: 'urgent' },
        { 'metadata.status': 'draft' }
      ]
    });

    // ASSERT: Verify the search results
    expect(foundDocuments.length).toBeGreaterThanOrEqual(1);
    foundDocuments.forEach(doc => {
      expect(doc.tags).toContain('urgent');
      expect(doc.metadata?.status).toBe('draft');
    });
  });

  test('should perform aggregation to count documents by status', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const expectedStatus = uuid();
    
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

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
    await DocumentModel.insertMany(documents);

    // ACT: Perform aggregation
    const result = await DocumentModel.aggregate([
      {
        $match: {
          ownerId: testUserId
        }
      },
      { $group: { _id: '$metadata.status', count: { $sum: 1 } } }
    ]);

    // ASSERT: Verify aggregation results
    const draftCount = await result.find(r => r._id === expectedStatus)?.count ?? 0;
    expect(draftCount).toBe(2);
  });

  test('should handle duplicate key errors', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    // Create a document with a specific name
    const documentData = await TestDataFactory.createDocument(testUserId, testFolderId, {
      name: 'unique-document'
    });
    await DocumentModel.create(documentData);

    // ACT & ASSERT: Attempt to insert document with same name
    await expect(DocumentModel.create({
      ...TestDataFactory.createDocument(testUserId, testFolderId, {
        name: 'unique-document'
      })
    })).rejects.toThrow();
  });

  test('should update multiple documents matching criteria', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    // Create multiple documents with same status
    const documents = Array.from({ length: 3 }, () => 
      TestDataFactory.createDocument(testUserId, testFolderId, {
        metadata: { status: 'draft', version: '1.0' }
      })
    );
    await DocumentModel.insertMany(documents);

    const expectedCount = await DocumentModel.countDocuments({
      'metadata.status': 'draft',
      ownerId: testUserId
    });

    // ACT: Update all matching documents
    const updateResult = await DocumentModel.updateMany(
      {
        ownerId: testUserId,
        'metadata.status': 'draft'
      },
      { 
        $set: { 
          'metadata.status': 'review',
          'metadata.version': '1.1',
          updatedAt: new Date()
        }
      }
    );

    // ASSERT: Verify the update operation
    expect(updateResult.modifiedCount).toBe(expectedCount);

    // ASSERT: Verify all documents were updated
    const updatedDocs = await DocumentModel.find({
      ownerId: user.id,
      'metadata.status': 'review'
    });
    updatedDocs.forEach(doc => {
      expect(doc.metadata?.status).toBe('review');
      expect(doc.metadata?.version).toBe('1.1');
    });
  });

  test('should perform text search on document content', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    // Create text index
    await DocumentModel.collection.createIndex({ content: 'text' });

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
    await DocumentModel.insertMany(documents);

    // ACT: Perform text search
    const searchResults = await DocumentModel.find(
      { 
        ownerId: testUserId,
        $text: { $search: 'MongoDB testing' } 
      }
    );

    // ASSERT: Verify search results
    expect(searchResults.some(doc => doc.content?.includes('MongoDB'))).toBe(true);
    expect(searchResults.some(doc => doc.content?.includes('testing'))).toBe(true);
  });

  test('should perform geospatial queries', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    // Create geospatial index
    await DocumentModel.collection.createIndex({ location: '2dsphere' });

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
    await DocumentModel.insertMany(documents);

    // ACT: Find documents within 100km of New York
    const nearbyDocs = await DocumentModel.find({
      ownerId: testUserId,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [-74.0060, 40.7128] // New York [longitude, latitude]
          },
          $maxDistance: 100000 // 100km in meters
        }
      }
    });

    // ASSERT: Verify geospatial query results
    expect(nearbyDocs.length).toBeGreaterThanOrEqual(1);
    nearbyDocs.forEach(doc => {
      expect(doc.name).toBe('Nearby Document');
    });
  });

  test('should use indexes for efficient querying', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    // Create compound index
    await DocumentModel.collection.createIndex({ 
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
    await DocumentModel.insertMany(documents);

    // ACT: Query using indexed fields
    const explain = await DocumentModel.collection.find({
      'metadata.status': 'draft',
      'metadata.version': '1.0'
    }).explain('executionStats');

    // ASSERT: Verify index usage
    expect(explain.queryPlanner.winningPlan.inputStage.indexName).toBe('metadata.status_1_metadata.version_1');
  });

  test('should perform complex aggregation pipeline', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

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
    await DocumentModel.insertMany(documents);

    // ACT: Perform complex aggregation
    const result = await DocumentModel.aggregate([
      // Match documents
      { $match: { 'metadata.status': { $in: ['draft', 'review'] }, ownerId: testUserId } },
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
    ]);

    // ASSERT: Verify aggregation results
    expect(result.length).toBe(3);
    expect(result[0].count).toBeDefined();
    expect(result[0].totalSize).toBeDefined();
    expect(result[0].avgSize).toBeDefined();
  });

  test('should validate document schema', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    // ACT & ASSERT: Attempt to insert invalid document
    await expect(DocumentModel.create({
      _id: new ObjectId(),
      ownerId: testUserId,
      folderId: testFolderId,
      // Missing required fields
      createdAt: new Date(),
      updatedAt: new Date()
    })).rejects.toThrow();
  });

  test('should use cursor for large result sets', async ({ DocumentModel, UserModel, FolderModel }) => {
    // ARRANGE: Create test user and folder
    const batchSize = 10;
    
    const userData = TestDataFactory.createUser();
    const user = await UserModel.create(userData);
    const testUserId = user._id;

    const folderData = TestDataFactory.createFolder(testUserId);
    const folder = await FolderModel.create(folderData);
    const testFolderId = folder._id;

    // Create multiple documents
    const documents = Array.from({ length: 100 }, (_, i) => 
      TestDataFactory.createDocument(testUserId, testFolderId, {
        name: `Document ${i}`,
        metadata: { status: 'draft', version: '1.0' }
      })
    );
    await DocumentModel.insertMany(documents);

    // ACT: Use cursor to process documents
    const cursor = DocumentModel.find({ ownerId: testUserId }).cursor({ batchSize });
    const processedDocs: any[] = [];

    for await (const doc of cursor) {
      processedDocs.push(doc);
    }

    // ASSERT: Verify all documents were processed
    const count = await DocumentModel.countDocuments({ ownerId: testUserId });
    expect(processedDocs.length).toBe(count);
  });
}); 