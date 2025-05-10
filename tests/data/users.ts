export interface UserData {
  name: string;
  email: string;
  age: number;
  active?: boolean;
}

export const testUsers: UserData[] = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    active: true
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    age: 28,
    active: true
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    age: 35,
    active: true
  },
  {
    name: 'Alice Brown',
    email: 'alice@example.com',
    age: 42,
    active: true
  },
  {
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    age: 25,
    active: false
  }
];

export const testUser = testUsers[0];

export const ageRange = {
  min: 30,
  max: 40
}; 