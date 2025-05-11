import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import * as ormconfig from '../../ormconfig.json';
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';

async function main() {
  try {
    // Create connection
    const dataSource = new DataSource({
      ...ormconfig as MongoConnectionOptions,
      entities: ["./src/entities/*.ts"],
    });

    // Initialize connection
    await dataSource.initialize();
    console.log('Connected to MongoDB!');

    // Create a new user
    const user = new User();
    user.name = 'John Doe';
    user.email = 'john@example.com';
    user.age = 30;

    // Save user
    const savedUser = await dataSource.manager.save(user);
    console.log('Saved user:', savedUser);

    // Find all users
    const users = await dataSource.manager.find(User);
    console.log('All users:', users);

    // Close connection
    await dataSource.destroy();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 