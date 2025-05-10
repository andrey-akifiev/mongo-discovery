import { ObjectId } from 'mongodb';

export interface User {
  name: string;
  email: string;
  age: number;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Folder {
  name: string;
  ownerId: ObjectId;
  parentId: ObjectId | null;
  path: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Document {
  name: string;
  content?: string;
  ownerId: ObjectId;
  folderId: ObjectId;
  tags?: string[];
  metadata?: {
    fileSize?: number;
    fileType?: string;
    lastModified?: Date;
    version?: string;
    status?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
} 