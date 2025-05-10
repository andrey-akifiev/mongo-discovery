import { MongoClient } from 'mongodb';
import { promises as fs } from 'fs';
import path from 'path';

export interface Migration {
  version: number;
  name: string;
  up: (db: any) => Promise<void>;
}

const MIGRATIONS_DIR = path.join(__dirname, 'versions');

async function getMigrations(): Promise<Migration[]> {
  const files = await fs.readdir(MIGRATIONS_DIR);
  const migrations: Migration[] = [];

  for (const file of files) {
    if (file.endsWith('.ts')) {
      const migration = await import(path.join(MIGRATIONS_DIR, file));
      migrations.push(migration.default);
    }
  }

  return migrations.sort((a, b) => a.version - b.version);
}

async function getCurrentVersion(db: any): Promise<number> {
  const versionCollection = db.collection('migrations');
  const lastMigration = await versionCollection.findOne({}, { sort: { version: -1 } });
  return lastMigration ? lastMigration.version : 0;
}

async function migrate() {
  const client = new MongoClient('mongodb://root:example@localhost:27017/test?authSource=admin');
  
  try {
    await client.connect();
    const db = client.db();
    const migrations = await getMigrations();
    const currentVersion = await getCurrentVersion(db);

    console.log(`Current database version: ${currentVersion}`);
    console.log(`Found ${migrations.length} migrations`);

    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        console.log(`Running migration ${migration.version}: ${migration.name}`);
        await migration.up(db);
        await db.collection('migrations').insertOne({
          version: migration.version,
          name: migration.name,
          appliedAt: new Date()
        });
        console.log(`Migration ${migration.version} completed`);
      }
    }

    console.log('All migrations completed');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

migrate().catch(console.error); 