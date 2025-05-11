import { v4 as uuidv4 } from 'uuid';

export class TestDataFactory {
  static generateDate(startDate = new Date(2020, 0, 1), endDate = new Date()) {
    const start = startDate.getTime();
    const end = endDate.getTime();
    const randomTime = start + Math.random() * (end - start);
    return new Date(randomTime);
  }

  static generateName(prefix = 'Test') {
    return `${prefix}-${uuidv4()}`;
  }

  static generateEmail(prefix = 'test') {
    return `${prefix}-${uuidv4()}@example.com`;
  }

  static generateAge(min = 18, max = 65) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static createUser(overrides = {}) {
    const createdAt = this.generateDate();
    const defaultUser = {
      name: this.generateName('User'),
      email: this.generateEmail('user'),
      age: this.generateAge(),
      active: true,
      createdAt,
      updatedAt: this.generateDate(createdAt) // updatedAt should be after createdAt
    };

    return { ...defaultUser, ...overrides };
  }

  static createFolder(ownerId, overrides = {}) {
    const folderName = this.generateName('Folder');
    const createdAt = this.generateDate();
    const defaultFolder = {
      name: folderName,
      ownerId,
      parentId: null,
      path: `/${folderName}`,
      createdAt,
      updatedAt: this.generateDate(createdAt) // updatedAt should be after createdAt
    };

    return { ...defaultFolder, ...overrides };
  }

  static createDocument(ownerId, folderId, overrides = {}) {
    const createdAt = this.generateDate();
    const defaultDocument = {
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
  static createUsers(count, overrides = {}) {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  static createFolders(count, ownerId, overrides = {}) {
    return Array.from({ length: count }, () => this.createFolder(ownerId, overrides));
  }

  static createDocuments(count, ownerId, folderId, overrides = {}) {
    return Array.from({ length: count }, () => this.createDocument(ownerId, folderId, overrides));
  }
} 