import Realm from 'realm';
import { v4 as uuid } from 'uuid';

interface BaseEntity {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface User extends BaseEntity {
  name: string;
  email: string;
  age?: number;
  active?: boolean;
  tags: string[];
}

interface Folder extends BaseEntity {
  name: string;
  ownerId: string;
  parentId?: string;
  path: string;
}

interface DocumentMetadata {
  fileSize: number;
  fileType: string;
  lastModified: Date;
  version: string;
  status: string;
  downloadCount?: number;
  [key: string]: any;
}

interface Location {
  type: string;
  coordinates: [number, number];
}

interface Document extends BaseEntity {
  name: string;
  content: string;
  ownerId: string;
  folderId: string;
  tags: string[];
  metadata: DocumentMetadata;
  location: Location;
}

interface QueryOptions {
  where?: Record<string, any>;
  order?: Record<string, 'ASC' | 'DESC'>;
  skip?: number;
  take?: number;
}

type RealmObject<T> = Realm.Object<T> & T;

export class BaseTest {
  private realm: Realm | null;
  private schema: Realm.ObjectSchema[];

  constructor() {
    this.realm = null;
    this.schema = [
      {
        name: 'User',
        primaryKey: '_id',
        properties: {
          _id: 'string',
          name: 'string',
          email: 'string',
          age: 'int?',
          active: 'bool?',
          tags: 'string[]',
          createdAt: 'date',
          updatedAt: 'date'
        }
      },
      {
        name: 'Folder',
        primaryKey: '_id',
        properties: {
          _id: 'string',
          name: 'string',
          ownerId: 'string',
          parentId: 'string?',
          path: 'string',
          createdAt: 'date',
          updatedAt: 'date'
        }
      },
      {
        name: 'Document',
        primaryKey: '_id',
        properties: {
          _id: 'string',
          name: 'string',
          content: 'string',
          ownerId: 'string',
          folderId: 'string',
          tags: 'string[]',
          metadata: 'mixed',
          location: 'mixed',
          createdAt: 'date',
          updatedAt: 'date'
        }
      }
    ];
  }

  async beforeAll(): Promise<Realm> {
    const dbName = `test-${uuid()}`;
    
    this.realm = await Realm.open({
      schema: this.schema,
      path: dbName,
      deleteRealmIfMigrationNeeded: true
    });

    return this.realm;
  }

  async afterAll(): Promise<void> {
    if (this.realm) {
      this.realm.close();
    }
  }

  async cleanup(): Promise<void> {
    
  }

  create<T extends BaseEntity>(collection: string, data: Partial<T>): RealmObject<T> {
    if (!this.realm) throw new Error('Realm not initialized');
    
    return this.realm.write(() => {
      return this.realm.create(collection, {
        _id: uuid(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      } as T);
    });
  }

  find<T extends BaseEntity>(collection: string, query: QueryOptions = {}): RealmObject<T>[] {
    if (!this.realm) throw new Error('Realm not initialized');
    
    let objects = this.realm.objects<T>(collection);
    
    if (query.where) {
      Object.entries(query.where).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([op, opValue]) => {
            switch (op) {
              case '$gt':
                objects = objects.filtered(`${key} > $0`, opValue);
                break;
              case '$lt':
                objects = objects.filtered(`${key} < $0`, opValue);
                break;
              case '$gte':
                objects = objects.filtered(`${key} >= $0`, opValue);
                break;
              case '$lte':
                objects = objects.filtered(`${key} <= $0`, opValue);
                break;
              case '$in':
                objects = objects.filtered(`${key} IN $0`, opValue);
                break;
              case '$nin':
                objects = objects.filtered(`NOT ${key} IN $0`, opValue);
                break;
              case '$exists':
                if (opValue) {
                  objects = objects.filtered(`${key} != null`);
                } else {
                  objects = objects.filtered(`${key} == null`);
                }
                break;
            }
          });
        } else {
          objects = objects.filtered(`${key} == $0`, value);
        }
      });
    }

    if (query.order) {
      Object.entries(query.order).forEach(([key, direction]) => {
        objects = objects.sorted(key, direction === 'DESC');
      });
    }

    const results = Array.from(objects);
    
    if (query.skip) {
      results.splice(0, query.skip);
    }
    if (query.take) {
      results.splice(query.take);
    }

    return results;
  }

  findOne<T extends BaseEntity>(collection: string, query: QueryOptions = {}): RealmObject<T> | null {
    const results = this.find<T>(collection, { ...query, take: 1 });
    return results[0] || null;
  }

  update<T extends BaseEntity>(collection: string, query: QueryOptions, update: Partial<T>): number {
    if (!this.realm) throw new Error('Realm not initialized');
    
    const objects = this.find<T>(collection, query);
    
    this.realm.write(() => {
      objects.forEach(obj => {
        Object.entries(update).forEach(([key, value]) => {
          if (key.includes('.')) {
            const [parent, child] = key.split('.');
            const parentObj = obj[parent as keyof T] as Record<string, any>;
            if (!parentObj) {
              (obj as any)[parent] = {};
            }
            (obj as any)[parent][child] = value;
          } else {
            (obj as any)[key] = value;
          }
        });
        (obj as any).updatedAt = new Date();
      });
    });

    return objects.length;
  }

  delete<T extends BaseEntity>(collection: string, query: QueryOptions): number {
    if (!this.realm) throw new Error('Realm not initialized');
    
    const objects = this.find<T>(collection, query);
    
    this.realm.write(() => {
      this.realm.delete(objects);
    });

    return objects.length;
  }

  count<T extends BaseEntity>(collection: string, query: QueryOptions = {}): number {
    return this.find<T>(collection, query).length;
  }

  exists<T extends BaseEntity>(collection: string, query: QueryOptions): boolean {
    return this.count<T>(collection, query) > 0;
  }
} 