import { test, expect } from '@playwright/test';
import { DataSource, Entity, ObjectIdColumn, Column, ObjectId, Like } from 'typeorm';
import 'reflect-metadata';
import { testUsers, testUser, ageRange, UserData } from '../data/users';

@Entity()
class User {
  @ObjectIdColumn()
  id!: ObjectId;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  age!: number;

  @Column({ default: true })
  active!: boolean;
}

const AppDataSource = new DataSource({
  type: 'mongodb',
  host: 'localhost',
  port: 27017,
  username: 'root',
  password: 'example',
  database: 'test',
  authSource: 'admin',
  entities: [User],
  synchronize: true
});

test.describe('TypeORM Basic Operations', () => {
  let userRepository: any;

  test.beforeAll(async () => {
    await AppDataSource.initialize();
    userRepository = AppDataSource.getRepository(User);
  });

  test.afterAll(async () => {
    await AppDataSource.destroy();
  });

  test('should create a new user', async () => {
    const user = userRepository.create(testUser);
    const savedUser = await userRepository.save(user);

    expect(savedUser.name).toBe(testUser.name);
    expect(savedUser.email).toBe(testUser.email);
    expect(savedUser.age).toBe(testUser.age);
  });

  test('should find user by email', async () => {
    const user = await userRepository.findOne({ where: { email: testUser.email } });
    expect(user).toBeDefined();
    expect(user.email).toBe(testUser.email);
  });

  test('should update user age', async () => {
    const user = await userRepository.findOne({ where: { email: testUser.email } });
    const newAge = 31;
    
    await userRepository.update(user.id, { age: newAge });
    const updatedUser = await userRepository.findOne({ where: { id: user.id } });
    
    expect(updatedUser.age).toBe(newAge);
  });

  test('should find users by age range', async () => {
    const users = await userRepository.find({
      where: {
        age: { $gte: ageRange.min, $lte: ageRange.max }
      }
    });
    
    expect(users.length).toBeGreaterThan(0);
    users.forEach((user: User) => {
      expect(user.age).toBeGreaterThanOrEqual(ageRange.min);
      expect(user.age).toBeLessThanOrEqual(ageRange.max);
    });
  });

  test('should delete user', async () => {
    const user = await userRepository.findOne({ where: { email: testUser.email } });
    await userRepository.delete(user.id);
    
    const deletedUser = await userRepository.findOne({ where: { id: user.id } });
    expect(deletedUser).toBeNull();
  });

  test('should create multiple users and find them', async () => {
    const createdUsers = await userRepository.save(testUsers);
    expect(createdUsers).toHaveLength(testUsers.length);

    const foundUsers = await userRepository.find({
      where: { age: { $gt: ageRange.min } }
    });
    expect(foundUsers.length).toBeGreaterThanOrEqual(2);
  });
}); 