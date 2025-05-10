import { test as base, expect } from '@playwright/test';
import mongoose from 'mongoose';
import { User, Folder, Document } from '../../interfaces';

// Define Mongoose schemas
const userSchema = new mongoose.Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  age: { type: Number, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const folderSchema = new mongoose.Schema<Folder>({
  name: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  path: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const documentSchema = new mongoose.Schema<Document>({
  name: { type: String, required: true },
  content: { type: String },
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  tags: { type: [String], default: [] },
  metadata: {
    type: {
      fileSize: { type: Number },
      fileType: { type: String },
      lastModified: { type: Date },
      version: { type: String },
      status: { type: String },
      documentId: { type: String },
      downloadCount: { type: Number },
      priority: { type: String },
      expiresAt: { type: Date },
      parentId: { type: mongoose.Schema.Types.ObjectId },
      createdBy: { type: mongoose.Schema.Types.ObjectId },
      // Allow additional metadata fields
      additionalFields: mongoose.Schema.Types.Mixed
    },
    default: {}
  },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { 
      type: [Number],
      validate: {
        validator: function(v: number[]) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && // longitude
                 v[1] >= -90 && v[1] <= 90;     // latitude
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges'
      }
    }
  },
  lastAccessed: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const UserModel = mongoose.model<User>('User', userSchema);
const FolderModel = mongoose.model<Folder>('Folder', folderSchema);
const DocumentModel = mongoose.model<Document>('Document', documentSchema);

// Extend the base test type
type TestFixtures = {
  connection: typeof mongoose;
  UserModel: mongoose.Model<User>;
  FolderModel: mongoose.Model<Folder>;
  DocumentModel: mongoose.Model<Document>;
};

// Connection options
const connectionOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Timeout for socket operations
  connectTimeoutMS: 10000, // Timeout for initial connection
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 5, // Minimum number of connections in the pool
  retryWrites: true, // Retry write operations if they fail
  retryReads: true, // Retry read operations if they fail
};

// Connection string
const MONGODB_URI = 'mongodb://root:example@localhost:27017/test?authSource=admin';

// Global connection state
let isConnected = false;

// Create the test fixture
export const test = base.extend<TestFixtures>({
  connection: async ({}, use) => {
    await use(mongoose);
  },

  UserModel: async ({}, use) => {
    await use(UserModel);
  },

  FolderModel: async ({}, use) => {
    await use(FolderModel);
  },

  DocumentModel: async ({}, use) => {
    await use(DocumentModel);
  }
});

// Setup connection before all tests
test.beforeAll(async () => {
  try {
    if (!isConnected) {
      await mongoose.connect(MONGODB_URI, connectionOptions);
      isConnected = true;
      console.log('Connected to MongoDB');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
});

// Cleanup after all tests
test.afterAll(async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB');
  }
});

export { expect }; 