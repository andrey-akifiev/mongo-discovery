import "reflect-metadata";
import * as mongoConfig from "../../ormconfig.json";
import { DataSource, MongoEntityManager, MongoRepository, EntityTarget, ObjectLiteral } from "typeorm";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";

export class MongoDataSource {
  private static instance: MongoDataSource;
  public dataSource: DataSource;

  private constructor() {
    this.dataSource = new DataSource({
      ...mongoConfig as MongoConnectionOptions,
    });
    console.log(this.dataSource)
  }

  public static getInstance(): MongoDataSource {
    if (!MongoDataSource.instance) {
      MongoDataSource.instance = new MongoDataSource();
    }
    return MongoDataSource.instance;
  }

  public async initialize(): Promise<void> {
    try {
      await this.dataSource.initialize();
      console.log("MongoDB connection has been initialized successfully");
    } catch (error) {
      console.error("Error during MongoDB connection initialization:", error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      await this.dataSource.destroy();
      console.log("MongoDB connection has been closed successfully");
    } catch (error) {
      console.error("Error during MongoDB connection closure:", error);
      throw error;
    }
  }

  public getDataSource(): DataSource {
    return this.dataSource;
  }

  public getEntityManager(): MongoEntityManager {
    return this.dataSource.mongoManager;
  }

  public getMongoRepository<T extends ObjectLiteral>(entity: EntityTarget<T>): MongoRepository<T> {
    return this.dataSource.getMongoRepository(entity);
  }
}