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

test.describe('Basic Realm Operations', () => {
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

  test.describe('CRUD Operations', () => {
    test('should perform basic CRUD operations', async () => {
      // Create a user and folder
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);
      expect(createdUser).toBeDefined();
      expect(createdUser.name).toBe(user.name);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);
      expect(createdFolder).toBeDefined();
      expect(createdFolder.name).toBe(folder.name);

      // Create a document
      const document = TestDataFactory.createDocument(createdUser._id, createdFolder._id);
      const createdDocument = await baseTest.create<Document>('Document', document);
      expect(createdDocument).toBeDefined();
      expect(createdDocument.name).toBe(document.name);

      // Read the document
      const foundDocument = await baseTest.findOne<Document>('Document', { where: { _id: createdDocument._id } });
      expect(foundDocument).toBeDefined();
      expect(foundDocument?.name).toBe(document.name);

      // Update the document
      const updatedName = 'Updated Document Name';
      const updatedCount = await baseTest.update<Document>('Document', 
        { where: { _id: createdDocument._id } }, 
        { name: updatedName }
      );
      expect(updatedCount).toBeGreaterThan(0);

      // Verify the update
      const foundUpdatedDocument = await baseTest.findOne<Document>('Document', { where: { _id: createdDocument._id } });
      expect(foundUpdatedDocument?.name).toBe(updatedName);

      // Delete the document
      const deletedCount = await baseTest.delete<Document>('Document', { where: { _id: createdDocument._id } });
      expect(deletedCount).toBeGreaterThan(0);

      // Verify deletion
      const foundDeletedDocument = await baseTest.findOne<Document>('Document', { where: { _id: createdDocument._id } });
      expect(foundDeletedDocument).toBeNull();
    });
  });

  test.describe('Find Operations', () => {
    test('should find documents with filters', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      const documents = TestDataFactory.createDocuments(3, createdUser._id, createdFolder._id);
      for (const doc of documents) {
        await baseTest.create<Document>('Document', doc);
      }

      // Find documents with filter
      const foundDocuments = await baseTest.find<Document>('Document', { where: { folderId: createdFolder._id } });
      expect(foundDocuments).toHaveLength(3);
    });

    test('should find documents with sorting', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      const documents = TestDataFactory.createDocuments(3, createdUser._id, createdFolder._id);
      for (const doc of documents) {
        await baseTest.create<Document>('Document', doc);
      }

      // Find documents with sorting
      const foundDocuments = await baseTest.find<Document>('Document', 
        { where: { folderId: createdFolder._id }, order: { name: 'ASC' } }
      );
      expect(foundDocuments).toHaveLength(3);
      expect(foundDocuments[0].name <= foundDocuments[1].name).toBe(true);
      expect(foundDocuments[1].name <= foundDocuments[2].name).toBe(true);
    });

    test('should find documents with pagination', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      const documents = TestDataFactory.createDocuments(5, createdUser._id, createdFolder._id);
      for (const doc of documents) {
        await baseTest.create<Document>('Document', doc);
      }

      // Find documents with pagination
      const foundDocuments = await baseTest.find<Document>('Document', 
        { where: { folderId: createdFolder._id }, skip: 2, take: 2 }
      );
      expect(foundDocuments).toHaveLength(2);
    });
  });

  test.describe('Count Operations', () => {
    test('should count documents', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      const documents = TestDataFactory.createDocuments(3, createdUser._id, createdFolder._id);
      for (const doc of documents) {
        await baseTest.create<Document>('Document', doc);
      }

      // Count documents
      const count = await baseTest.count<Document>('Document', { where: { folderId: createdFolder._id } });
      expect(count).toBe(3);
    });
  });

  test.describe('Existence Checks', () => {
    test('should check if document exists', async () => {
      // Create test data
      const user = TestDataFactory.createUser();
      const createdUser = await baseTest.create<User>('User', user);

      const folder = TestDataFactory.createFolder(createdUser._id);
      const createdFolder = await baseTest.create<Folder>('Folder', folder);

      const document = TestDataFactory.createDocument(createdUser._id, createdFolder._id);
      const createdDocument = await baseTest.create<Document>('Document', document);

      // Check existence
      const exists = await baseTest.exists<Document>('Document', { where: { _id: createdDocument._id } });
      expect(exists).toBe(true);

      // Check non-existence
      const nonExists = await baseTest.exists<Document>('Document', { where: { _id: 'non-existent-id' } });
      expect(nonExists).toBe(false);
    });
  });
}); 