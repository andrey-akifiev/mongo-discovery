import { test as base, expect } from '@playwright/test';
import { MongoClient, Collection } from 'mongodb';
import { User, Folder, Document } from '../../interfaces';

// Extend the base test type
type TestFixtures = {
  client: MongoClient;
  usersCollection: Collection<User>;
  foldersCollection: Collection<Folder>;
  documentsCollection: Collection<Document>;
};

export const test = base.extend<TestFixtures>({
  client: async ({}, use) => {
    const client = new MongoClient('mongodb://root:example@localhost:27017/test?authSource=admin');
    await client.connect();
    await use(client);
    await client.close();
  },

  usersCollection: async ({ client }, use) => {
    const collection = client.db('test').collection<User>('users');
    await use(collection);
  },

  foldersCollection: async ({ client }, use) => {
    const collection = client.db('test').collection<Folder>('folders');
    await use(collection);
  },

  documentsCollection: async ({ client }, use) => {
    const collection = client.db('test').collection<Document>('documents');
    await use(collection);
  }
});

export { expect }; 