import { BaseTest } from './base-test';
import { TestDataFactory } from './test-data-factory';
import Realm from 'realm';
import { test, expect } from '@playwright/test';

interface User {
  _id: string;
  name: string;
  email: string;
  age?: number;
  active?: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Folder {
  _id: string;
  name: string;
  ownerId: string;
  parentId?: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Document {
  _id: string;
  name: string;
  content: string;
  ownerId: string;
  folderId: string;
  tags: string[];
  metadata: {
    fileSize: number;
    fileType: string;
    lastModified: Date;
    version: string;
    status: string;
    downloadCount?: number;
    [key: string]: any;
  };
  location: {
    type: string;
    coordinates: [number, number];
  };
  createdAt: Date;
  updatedAt: Date;
}

test.describe('Realm Aggregation Operations', () => {
  let baseTest: BaseTest;
  let realm: Realm;

  test.beforeAll(async () => {
    baseTest = new BaseTest();
    realm = await baseTest.beforeAll();
  });

  test.afterAll(async () => {
    await baseTest.afterAll();
  });

  test.beforeEach(async () => {
    await baseTest.cleanup();
  });

  test.describe('Basic Aggregation', () => {
    test('should perform basic aggregation', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      // Create documents with different scores
      const baseDocument = TestDataFactory.createDocument(createdUser._id, createdFolder._id);
      const documents = [
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...baseDocument.metadata,
            score: 80 
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...baseDocument.metadata,
            score: 90 
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...baseDocument.metadata,
            score: 100 
          } 
        })
      ];

      for (const doc of documents) {
        await baseTest.create<Document>('Document', doc);
      }

      // Calculate average score
      const allDocuments = await baseTest.find<Document>('Document', { where: { folderId: createdFolder._id } });
      const averageScore = allDocuments.reduce((sum, doc) => sum + (doc.metadata.score || 0), 0) / allDocuments.length;

      expect(averageScore).toBe(90);
    });
  });

  test.describe('Group Aggregation', () => {
    test('should perform group aggregation', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      // Create documents with different categories and scores
      const baseDocument = TestDataFactory.createDocument(createdUser._id, createdFolder._id);
      const documents = [
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...baseDocument.metadata,
            category: 'A',
            score: 80 
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...baseDocument.metadata,
            category: 'A',
            score: 90 
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...baseDocument.metadata,
            category: 'B',
            score: 100 
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...baseDocument.metadata,
            category: 'B',
            score: 70 
          } 
        })
      ];

      for (const doc of documents) {
        await baseTest.create<Document>('Document', doc);
      }

      // Group by category and calculate statistics
      const allDocuments = await baseTest.find<Document>('Document', { where: { folderId: createdFolder._id } });
      
      const groupedByCategory = allDocuments.reduce((acc, doc) => {
        const category = doc.metadata.category;
        if (!acc[category]) {
          acc[category] = {
            count: 0,
            totalScore: 0,
            documents: []
          };
        }
        acc[category].count++;
        acc[category].totalScore += doc.metadata.score || 0;
        acc[category].documents.push(doc);
        return acc;
      }, {} as Record<string, { count: number; totalScore: number; documents: Document[] }>);

      // Verify results
      expect(groupedByCategory['A'].count).toBe(2);
      expect(groupedByCategory['A'].totalScore / groupedByCategory['A'].count).toBe(85);
      expect(groupedByCategory['B'].count).toBe(2);
      expect(groupedByCategory['B'].totalScore / groupedByCategory['B'].count).toBe(85);
    });
  });

  test.describe('Pipeline Aggregation', () => {
    test('should perform pipeline aggregation', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      // Create documents with scores
      const baseDocument = TestDataFactory.createDocument(createdUser._id, createdFolder._id);
      const documents = [
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...baseDocument.metadata,
            score: 80 
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...baseDocument.metadata,
            score: 90 
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...baseDocument.metadata,
            score: 100 
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...baseDocument.metadata,
            score: 70 
          } 
        })
      ];

      for (const doc of documents) {
        await baseTest.create<Document>('Document', doc);
      }

      // Perform pipeline operations
      const allDocuments = await baseTest.find<Document>('Document', { where: { folderId: createdFolder._id } });
      
      // Filter documents with score >= 80
      const filteredDocuments = allDocuments.filter(doc => (doc.metadata.score || 0) >= 80);
      
      // Calculate statistics
      const scores = filteredDocuments.map(doc => doc.metadata.score || 0);
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const max = Math.max(...scores);
      const min = Math.min(...scores);

      // Verify results
      expect(filteredDocuments).toHaveLength(3);
      expect(average).toBe(90);
      expect(max).toBe(100);
      expect(min).toBe(80);
    });
  });

  test.describe('Lookup Aggregation', () => {
    test('should perform lookup aggregation', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      // Create documents in the folder
      const documents = TestDataFactory.createDocuments(3, createdUser._id, createdFolder._id);
      for (const doc of documents) {
        await baseTest.create<Document>('Document', doc);
      }

      // Perform lookup (in Realm, we'll simulate this with a join-like operation)
      const allDocuments = await baseTest.find<Document>('Document', { where: { folderId: createdFolder._id } });
      const folderInfo = await baseTest.findOne<Folder>('Folder', { where: { _id: createdFolder._id } });

      // Verify results
      expect(allDocuments).toHaveLength(3);
      expect(allDocuments[0].folderId).toBe(folderInfo?._id);
      expect(allDocuments[1].folderId).toBe(folderInfo?._id);
      expect(allDocuments[2].folderId).toBe(folderInfo?._id);
    });
  });
}); 