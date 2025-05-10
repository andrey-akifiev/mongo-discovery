import { test, expect } from '@playwright/test';
import mongoose from 'mongoose';

// Define the User interface
interface IUser {
  name: string;
  email: string;
  age: number;
}

// Create the User Schema
const UserSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  age: { type: Number, required: true }
});

// Create the User model
const User = mongoose.model<IUser>('User', UserSchema);

test.describe('Mongoose Basic Operations', () => {
  test.beforeAll(async () => {
    // Connect to MongoDB with authentication
    await mongoose.connect('mongodb://root:example@localhost:27017/test?authSource=admin');
  });

  test.afterAll(async () => {
    // Close the connection
    await mongoose.connection.close();
  });

  test('should create a new user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.age).toBe(userData.age);
  });
}); 