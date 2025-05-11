import { EntitySchema } from 'typeorm';

const User = new EntitySchema({
  name: 'User',
  collection: 'users',
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
    email: {
      type: String,
      required: true,
      unique: true
    },
    age: {
      type: Number,
      required: true
    },
    active: {
      type: Boolean,
      default: true
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
      name: 'IDX_USER_EMAIL',
      unique: true,
      columns: ['email']
    },
    {
      name: 'IDX_USER_AGE',
      columns: ['age']
    },
  ]
});

export default User; 