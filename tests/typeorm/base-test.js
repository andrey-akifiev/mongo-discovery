import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as ormconfig from '../../ormconfig.json';
export class BaseTest {
  constructor() {
    this.dataSource = new DataSource({
      ...ormconfig,
    });
  }

  async beforeAll() {
    await this.dataSource.initialize();
    this.manager = this.dataSource.manager;
  }

  async afterAll() {
    await this.dataSource.destroy();
  }

  async cleanup() {
  }
} 