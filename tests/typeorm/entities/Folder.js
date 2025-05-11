import { EntitySchema } from 'typeorm';

const Folder = new EntitySchema({
  name: 'Folder',
  collection: 'folders',
  columns: {
    _id: {
      primary: true,
      type: 'string',
      objectId: true
    },
    name: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    parentId: {
      type: String,
      nullable: true
    },
    createdAt: {
      type: Date,
      createDate: true
    },
    updatedAt: {
      type: Date,
      updateDate: true
    }
  },
  indices: [
    {
      name: 'IDX_FOLDER_PATH',
      unique: true,
      columns: ['path']
    },
    {
      name: 'IDX_FOLDER_PARENT',
      columns: ['parentId']
    }
  ]
});

export default Folder; 