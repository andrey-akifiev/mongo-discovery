// Create users collection with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'age'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'must be a valid email address and is required'
        },
        age: {
          bsonType: 'int',
          minimum: 0,
          description: 'must be a positive integer and is required'
        },
        active: {
          bsonType: 'bool',
          description: 'must be a boolean if present'
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'must be a date'
        }
      }
    }
  }
});

// Create folders collection with validation
db.createCollection('folders', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'ownerId'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        ownerId: {
          bsonType: 'objectId',
          description: 'must be a valid user ID and is required'
        },
        parentId: {
          bsonType: ['objectId', 'null'],
          description: 'must be a valid folder ID or null'
        },
        path: {
          bsonType: 'string',
          description: 'must be a string representing the folder path'
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'must be a date'
        }
      }
    }
  }
});

// Create documents collection with validation
db.createCollection('documents', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'ownerId', 'folderId'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        content: {
          bsonType: 'string',
          description: 'must be a string'
        },
        ownerId: {
          bsonType: 'objectId',
          description: 'must be a valid user ID and is required'
        },
        folderId: {
          bsonType: 'objectId',
          description: 'must be a valid folder ID and is required'
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'must be an array of strings'
        },
        metadata: {
          bsonType: 'object',
          description: 'must be an object containing document metadata'
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'must be a date'
        }
      }
    }
  }
});

// Create indexes for users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ active: 1 });
db.users.createIndex({ createdAt: 1 });

// Create indexes for folders
db.folders.createIndex({ ownerId: 1 });
db.folders.createIndex({ parentId: 1 });
db.folders.createIndex({ path: 1 });
db.folders.createIndex({ 
  ownerId: 1, 
  name: 1, 
  parentId: 1 
}, { unique: true }); // Ensure unique folder names within the same parent

// Create indexes for documents
db.documents.createIndex({ ownerId: 1 });
db.documents.createIndex({ folderId: 1 });
db.documents.createIndex({ tags: 1 });
db.documents.createIndex({ 
  ownerId: 1, 
  name: 1, 
  folderId: 1 
}, { unique: true }); // Ensure unique document names within the same folder
db.documents.createIndex({ createdAt: 1 });
db.documents.createIndex({ updatedAt: 1 }); 