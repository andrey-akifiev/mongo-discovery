import { Entity, ObjectIdColumn, Column, CreateDateColumn, UpdateDateColumn, ObjectId } from 'typeorm';

@Entity()
export class User {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  age!: number;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 