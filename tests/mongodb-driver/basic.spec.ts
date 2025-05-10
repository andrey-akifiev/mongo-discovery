import { test, expect } from '@playwright/test';
import { MongoClient } from 'mongodb';

// Define the User interface
interface User {
  name: string;
  email: string;
  age: number;
}

test.describe('MongoDB Driver Basic Operations', () => {
  let client: MongoClient;
  let collection: any;

  test.beforeAll(async () => {
    // Connect to MongoDB with authentication
    client = new MongoClient('mongodb://root:example@localhost:27017/test?authSource=admin');
    await client.connect();
    collection = client.db('test').collection<User>('users');
  });

  test.afterAll(async () => {
    // Close the connection
    await client.close();
  });

  test('should insert a new user', async () => {
    const userData: User = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      age: 25
    };

    const result = await collection.insertOne(userData);
    expect(result.acknowledged).toBe(true);
    expect(result.insertedId).toBeDefined();
  });
}); 