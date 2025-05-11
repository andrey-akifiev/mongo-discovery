import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Folder {
  id: string;
  name: string;
  ownerId: string;
  parentId?: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Document {
  id: string;
  name: string;
  content?: string;
  ownerId: string;
  folderId: string;
  tags: string[];
  metadata: Prisma.InputJsonValue;
  location: Prisma.InputJsonValue;
  lastAccessed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TestDataFactory {
  private static generateDate(
    startDate: Date = new Date(2020, 0, 1),
    endDate: Date = new Date()
  ): Date {
    const start = startDate.getTime();
    const end = endDate.getTime();
    const randomTime = start + Math.random() * (end - start);
    return new Date(randomTime);
  }

  private static generateName(prefix: string = 'Test'): string {
    return `${prefix}-${uuidv4()}`;
  }

  private static generateEmail(prefix: string = 'test'): string {
    return `${prefix}-${uuidv4()}@example.com`;
  }

  private static generateAge(min: number = 18, max: number = 65): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static createUser(overrides: Partial<User> = {}): User {
    const createdAt = this.generateDate();
    const defaultUser: User = {
      id: `user_${uuidv4()}`, // Ensure id is included
      name: this.generateName('User'),
      email: this.generateEmail('user'),
      age: this.generateAge(),
      active: true,
      createdAt,
      updatedAt: this.generateDate(createdAt) // updatedAt should be after createdAt
    };

    return { ...defaultUser, ...overrides };
  }

  static createFolder(ownerId: string, overrides: Partial<Folder> = {}): Folder {
    const folderName = this.generateName('Folder');
    const createdAt = this.generateDate();
    const defaultFolder: Folder = {
      id: `folder_${uuidv4()}`, // Ensure id is included
      name: folderName,
      ownerId,
      parentId: undefined, // Correctly typed as undefined
      path: `/${folderName}`,
      createdAt,
      updatedAt: this.generateDate(createdAt) // updatedAt should be after createdAt
    };

    return { ...defaultFolder, ...overrides };
  }

  static createDocument(ownerId: string, folderId: string, overrides: Partial<Document> = {}): Document {
    const createdAt = this.generateDate();
    const defaultDocument: Document = {
      id: `doc_${uuidv4()}`, // Ensure id is included
      name: this.generateName('Document'),
      content: 'This is a test document content',
      ownerId,
      folderId,
      tags: ['test'],
      metadata: {
        fileSize: 1024,
        fileType: 'txt',
        lastModified: this.generateDate(createdAt), // lastModified should be after createdAt
        version: '1.0',
        status: 'draft'
      },
      location: {
        type: 'Point',
        coordinates: [
          Math.random() * 360 - 180, // longitude between -180 and 180
          Math.random() * 180 - 90   // latitude between -90 and 90
        ]
      },
      createdAt,
      updatedAt: this.generateDate(createdAt) // updatedAt should be after createdAt
    };

    return { ...defaultDocument, ...overrides };
  }

  // Helper methods for creating multiple test objects
  static createUsers(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  static createFolders(count: number, ownerId: string, overrides: Partial<Folder> = {}): Folder[] {
    return Array.from({ length: count }, () => this.createFolder(ownerId, overrides));
  }

  static createDocuments(count: number, ownerId: string, folderId: string, overrides: Partial<Document> = {}): Document[] {
    return Array.from({ length: count }, () => this.createDocument(ownerId, folderId, overrides));
  }
} 