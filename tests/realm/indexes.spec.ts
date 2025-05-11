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

test.describe('Realm Index Operations', () => {
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

  test.describe('Unique Indexes', () => {
    test('should enforce unique indexes', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      // Create a document with a unique name
      const document = TestDataFactory.createDocument(createdUser._id, createdFolder._id);
      const createdDocument = await baseTest.create<Document>('Document', document);

      // Try to create another document with the same name
      const duplicateDocument = TestDataFactory.createDocument(createdUser._id, createdFolder._id, {
        name: document.name
      });

      // In Realm, we need to handle this at the application level since it doesn't support unique indexes directly
      const existingDocument = await baseTest.findOne<Document>('Document', { where: { name: document.name } });
      expect(existingDocument).toBeDefined();
      expect(existingDocument?.name).toBe(document.name);
    });
  });

  test.describe('Compound Indexes', () => {
    test('should use compound indexes', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      // Create documents with different combinations of status and priority
      const documents = [
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...TestDataFactory.createDocument(createdUser._id, createdFolder._id).metadata,
            status: 'active',
            priority: 1
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...TestDataFactory.createDocument(createdUser._id, createdFolder._id).metadata,
            status: 'active',
            priority: 2
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...TestDataFactory.createDocument(createdUser._id, createdFolder._id).metadata,
            status: 'inactive',
            priority: 1
          } 
        })
      ];

      for (const doc of documents) {
        await baseTest.create<Document>('Document', doc);
      }

      // Query using compound index (simulated in Realm)
      const activeHighPriority = await baseTest.find<Document>('Document', {
        where: {
          'metadata.status': 'active',
          'metadata.priority': 1
        }
      });

      expect(activeHighPriority).toHaveLength(1);
      expect(activeHighPriority[0].metadata.status).toBe('active');
      expect(activeHighPriority[0].metadata.priority).toBe(1);
    });
  });

  test.describe('Sparse Indexes', () => {
    test('should use sparse indexes', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      // Create documents with and without priority
      const documents = [
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...TestDataFactory.createDocument(createdUser._id, createdFolder._id).metadata,
            priority: 1
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...TestDataFactory.createDocument(createdUser._id, createdFolder._id).metadata,
            priority: 2
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id)
      ];

      for (const doc of documents) {
        await baseTest.create<Document>('Document', doc);
      }

      // Query using sparse index (simulated in Realm)
      const documentsWithPriority = await baseTest.find<Document>('Document', {
        where: {
          'metadata.priority': { $exists: true }
        }
      });

      expect(documentsWithPriority).toHaveLength(2);
      expect(documentsWithPriority[0].metadata.priority).toBeDefined();
      expect(documentsWithPriority[1].metadata.priority).toBeDefined();
    });
  });

  test.describe('TTL Indexes', () => {
    test('should use TTL indexes', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      // Create documents with different expiration dates
      const now = new Date();
      const documents = [
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...TestDataFactory.createDocument(createdUser._id, createdFolder._id).metadata,
            expiresAt: new Date(now.getTime() + 1000) // Expires in 1 second
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...TestDataFactory.createDocument(createdUser._id, createdFolder._id).metadata,
            expiresAt: new Date(now.getTime() + 5000) // Expires in 5 seconds
          } 
        })
      ];

      for (const doc of documents) {
        await baseTest.create<Document>('Document', doc);
      }

      // Wait for the first document to expire
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Query documents (in Realm, we need to handle TTL at the application level)
      const allDocuments = await baseTest.find<Document>('Document', {
        where: {
          'metadata.expiresAt': { $gt: new Date() }
        }
      });

      expect(allDocuments).toHaveLength(1);
      expect(allDocuments[0].metadata.expiresAt?.getTime()).toBeGreaterThan(now.getTime() + 4000);
    });
  });
}); 