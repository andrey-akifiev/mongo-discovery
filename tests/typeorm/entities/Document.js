import { EntitySchema } from 'typeorm';

export default new EntitySchema({
  name: 'Document',
  collection: 'documents',
  columns: {
    _id: {
      primary: true,
      type: 'ObjectId',
      objectId: true
    },
    name: {
      type: String,
      required: true,
      unique: true
    },
    content: {
      type: String,
      required: true
    },
    folderId: {
      type: 'ObjectId',
      required: true
    },
    metadata: {
      type: 'json',
      default: {
        status: 'draft',
        version: '1.0',
        priority: null,
        expiresAt: null,
        createdBy: null,
        fileSize: 0,
        downloadCount: 0
      }
    },
    tags: {
      type: [String],
      default: []
    },
    createdAt: {
      type: Date,
      createDate: true
    },
    updatedAt: {
      type: Date,
      updateDate: true
    }
  }
}); 