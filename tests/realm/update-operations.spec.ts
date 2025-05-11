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

test.describe('Realm Update Operations', () => {
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

  test.describe('Array Operations', () => {
    test('should modify arrays', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      const document = TestDataFactory.createDocument(createdUser._id, createdFolder._id);
      const createdDocument = await baseTest.create<Document>('Document', document);

      // Add tags to document
      const newTags = ['important', 'urgent'];
      const updatedCount = await baseTest.update<Document>('Document',
        { where: { _id: createdDocument._id } },
        { tags: [...document.tags, ...newTags] }
      );
      expect(updatedCount).toBeGreaterThan(0);

      // Verify tags were added
      const foundDocument = await baseTest.findOne<Document>('Document', { where: { _id: createdDocument._id } });
      expect(foundDocument?.tags).toContain('important');
      expect(foundDocument?.tags).toContain('urgent');

      // Remove tags from document
      const updatedCount2 = await baseTest.update<Document>('Document',
        { where: { _id: createdDocument._id } },
        { tags: foundDocument?.tags.filter(tag => !newTags.includes(tag)) }
      );
      expect(updatedCount2).toBeGreaterThan(0);

      // Verify tags were removed
      const foundDocument2 = await baseTest.findOne<Document>('Document', { where: { _id: createdDocument._id } });
      expect(foundDocument2?.tags).not.toContain('important');
      expect(foundDocument2?.tags).not.toContain('urgent');
    });
  });

  test.describe('Numeric Operations', () => {
    test('should perform numeric updates', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      const document = TestDataFactory.createDocument(createdUser._id, createdFolder._id);
      const createdDocument = await baseTest.create<Document>('Document', document);

      // Increment download count
      const initialCount = document.metadata.downloadCount || 0;
      const updatedCount = await baseTest.update<Document>('Document',
        { where: { _id: createdDocument._id } },
        { metadata: { ...document.metadata, downloadCount: initialCount + 1 } }
      );
      expect(updatedCount).toBeGreaterThan(0);

      // Verify increment
      const foundDocument = await baseTest.findOne<Document>('Document', { where: { _id: createdDocument._id } });
      expect(foundDocument?.metadata.downloadCount).toBe(initialCount + 1);

      // Multiply file size
      const initialSize = document.metadata.fileSize;
      const updatedCount2 = await baseTest.update<Document>('Document',
        { where: { _id: createdDocument._id } },
        { metadata: { ...document.metadata, fileSize: initialSize * 2 } }
      );
      expect(updatedCount2).toBeGreaterThan(0);

      // Verify multiplication
      const foundDocument2 = await baseTest.findOne<Document>('Document', { where: { _id: createdDocument._id } });
      expect(foundDocument2?.metadata.fileSize).toBe(initialSize * 2);
    });
  });

  test.describe('Field Modification', () => {
    test('should rename fields', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      const document = TestDataFactory.createDocument(createdUser._id, createdFolder._id);
      const createdDocument = await baseTest.create<Document>('Document', document);

      // Rename a field in metadata
      const oldValue = document.metadata.status;
      const updatedCount = await baseTest.update<Document>('Document',
        { where: { _id: createdDocument._id } },
        { 
          metadata: {
            ...document.metadata,
            status: '',
            state: oldValue
          }
        }
      );
      expect(updatedCount).toBeGreaterThan(0);

      // Verify field rename
      const foundDocument = await baseTest.findOne<Document>('Document', { where: { _id: createdDocument._id } });
      expect(foundDocument?.metadata.status).toBe('');
      expect(foundDocument?.metadata.state).toBe(oldValue);
    });
  });

  test.describe('Conditional Updates', () => {
    test('should update based on conditions', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      // Create documents with different statuses
      const documents = [
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...TestDataFactory.createDocument(createdUser._id, createdFolder._id).metadata,
            status: 'draft' 
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...TestDataFactory.createDocument(createdUser._id, createdFolder._id).metadata,
            status: 'published' 
          } 
        }),
        TestDataFactory.createDocument(createdUser._id, createdFolder._id, { 
          metadata: { 
            ...TestDataFactory.createDocument(createdUser._id, createdFolder._id).metadata,
            status: 'draft' 
          } 
        })
      ];

      for (const doc of documents) {
        await baseTest.create<Document>('Document', doc);
      }

      // Update only draft documents
      const updatedCount = await baseTest.update<Document>('Document',
        { where: { 'metadata.status': 'draft' } },
        { metadata: { ...documents[0].metadata, status: 'in-progress' } }
      );
      expect(updatedCount).toBe(2);

      // Verify updates
      const draftCount = await baseTest.count<Document>('Document', { where: { 'metadata.status': 'draft' } });
      const inProgressCount = await baseTest.count<Document>('Document', { where: { 'metadata.status': 'in-progress' } });
      const publishedCount = await baseTest.count<Document>('Document', { where: { 'metadata.status': 'published' } });

      expect(draftCount).toBe(0);
      expect(inProgressCount).toBe(2);
      expect(publishedCount).toBe(1);
    });
  });
}); 