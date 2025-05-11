import 'reflect-metadata';
import { test, expect } from '@playwright/test';
import { User } from './entities/User';
import { DataSource, getMongoManager } from 'typeorm';

test.describe('MongoDB Basic Operations', () => {
  test('should perform basic CRUD operations', async () => {
    try{
    const dataSource = new DataSource({
      type: "mongodb",
      host: "localhost",
      port: 27017,
      database: "test",
    });

    const manager = getMongoManager()

    // Create
    const user = new User();
    user.name = 'Test User';
    user.email = 'test@example.com';
    await manager.save(user);
  }catch(error){
    console.error(error)
  }
  });
}); 