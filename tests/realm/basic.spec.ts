import { test, expect } from '@playwright/test';
import Realm from 'realm';
import { testUsers, testUser, ageRange, UserData } from '../data/users';

// Define the User schema
class User extends Realm.Object {
  name!: string;
  email!: string;
  age!: number;
  active!: boolean;

  static schema: Realm.ObjectSchema = {
    name: 'User',
    properties: {
      name: 'string',
      email: 'string',
      age: 'int',
      active: { type: 'bool', default: true }
    }
  };
}

test.describe('Realm Basic Operations', () => {
  let realm: Realm;

  test.beforeAll(async () => {
    // Initialize Realm with local configuration
    realm = await Realm.open({
      schema: [User],
      inMemory: true // Use in-memory database for testing
    });
  });

  test.afterAll(async () => {
    // Close the Realm
    realm.close();
  });

  test('should create a new user', async () => {
    realm.write(() => {
      const user = realm.create('User', testUser);
      expect(user.name).toBe(testUser.name);
      expect(user.email).toBe(testUser.email);
      expect(user.age).toBe(testUser.age);
    });
  });

  test('should find user by email', async () => {
    const user = realm.objects('User').filtered('email == $0', testUser.email)[0];
    expect(user).toBeDefined();
    expect(user.email).toBe(testUser.email);
  });

  test('should update user age', async () => {
    const user = realm.objects('User').filtered('email == $0', testUser.email)[0];
    const newAge = 31;

    realm.write(() => {
      user.age = newAge;
    });

    const updatedUser = realm.objects('User').filtered('email == $0', testUser.email)[0];
    expect(updatedUser.age).toBe(newAge);
  });

  test('should find users by age range', async () => {
    const users = realm.objects('User').filtered('age >= $0 AND age <= $1', ageRange.min, ageRange.max);
    expect(users.length).toBeGreaterThan(0);
    
    for (const user of users) {
      expect(user.age).toBeGreaterThanOrEqual(ageRange.min);
      expect(user.age).toBeLessThanOrEqual(ageRange.max);
    }
  });

  test('should delete user', async () => {
    const user = realm.objects('User').filtered('email == $0', testUser.email)[0];
    
    realm.write(() => {
      realm.delete(user);
    });

    const deletedUser = realm.objects('User').filtered('email == $0', testUser.email)[0];
    expect(deletedUser).toBeUndefined();
  });

  test('should create multiple users and find them', async () => {
    realm.write(() => {
      testUsers.forEach(data => {
        realm.create('User', data);
      });
    });

    const allUsers = realm.objects('User');
    expect(allUsers.length).toBeGreaterThanOrEqual(testUsers.length);

    const olderUsers = realm.objects('User').filtered('age > $0', ageRange.min);
    expect(olderUsers.length).toBeGreaterThanOrEqual(2);
  });
}); 