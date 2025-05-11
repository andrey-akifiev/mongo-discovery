import { test, expect } from '@playwright/test';
import { BaseTest } from './base-test';
import { TestDataFactory } from './test-data-factory';

test.describe('MongoDB Aggregation Operations', () => {
  const baseTest = new BaseTest();

  test.beforeAll(async () => {
    await baseTest.beforeAll();
  });

  test.afterAll(async () => {
    await baseTest.afterAll();
  });

  test.afterEach(async () => {
    await baseTest.cleanup();
  });

  test('should perform basic aggregation', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    // Create documents with different scores
    const documents = TestDataFactory.createDocuments(3, savedUser._id, savedFolder._id, {
      metadata: { score: 85 }
    });
    await manager.save('Document', documents);

    // ACT: Calculate average score
    const avgScore = await manager
      .createAggregationBuilder('Document')
      .group('_id', null)
      .avg('metadata.score', 'averageScore')
      .getRawOne();

    // ASSERT: Verify aggregation
    expect(avgScore.averageScore).toBe(85);
  });

  test('should perform group aggregation', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    // Create documents with different categories
    const documents = [
      ...TestDataFactory.createDocuments(2, savedUser._id, savedFolder._id, {
        metadata: { category: 'A', score: 85 }
      }),
      ...TestDataFactory.createDocuments(3, savedUser._id, savedFolder._id, {
        metadata: { category: 'B', score: 90 }
      })
    ];
    await manager.save('Document', documents);

    // ACT: Group by category and calculate stats
    const categoryStats = await manager
      .createAggregationBuilder('Document')
      .group('metadata.category', {
        count: { $sum: 1 },
        avgScore: { $avg: '$metadata.score' }
      })
      .getRawMany();

    // ASSERT: Verify group aggregation
    expect(categoryStats).toHaveLength(2);
    const categoryA = categoryStats.find(stat => stat._id === 'A');
    expect(categoryA.count).toBe(2);
    expect(categoryA.avgScore).toBe(85);
  });

  test('should perform pipeline aggregation', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    // Create documents with scores
    const documents = TestDataFactory.createDocuments(3, savedUser._id, savedFolder._id, {
      metadata: { 
        scores: [85, 90, 95],
        category: 'test'
      }
    });
    await manager.save('Document', documents);

    // ACT: Complex pipeline with multiple stages
    const results = await manager
      .createAggregationBuilder('Document')
      .match({ 'metadata.category': 'test' })
      .unwind('metadata.scores')
      .group('_id', null, {
        avgScore: { $avg: '$metadata.scores' },
        maxScore: { $max: '$metadata.scores' },
        minScore: { $min: '$metadata.scores' }
      })
      .getRawOne();

    // ASSERT: Verify pipeline aggregation
    expect(results.avgScore).toBe(90);
    expect(results.maxScore).toBe(95);
    expect(results.minScore).toBe(85);
  });

  test('should perform lookup aggregation', async () => {
    const { manager } = baseTest;

    // ARRANGE: Create test user and folder
    const userData = TestDataFactory.createUser();
    const savedUser = await manager.save('User', userData);

    const folderData = TestDataFactory.createFolder(savedUser._id);
    const savedFolder = await manager.save('Folder', folderData);

    // Create documents in the folder
    const documents = TestDataFactory.createDocuments(3, savedUser._id, savedFolder._id);
    await manager.save('Document', documents);

    // ACT: Lookup documents in folder
    const results = await manager
      .createAggregationBuilder('Folder')
      .match({ _id: savedFolder._id })
      .lookup('Document', 'documents', '_id', 'folderId')
      .getRawOne();

    // ASSERT: Verify lookup aggregation
    expect(results.documents).toHaveLength(3);
    results.documents.forEach(doc => {
      expect(doc.folderId).toBe(savedFolder._id);
    });
  });
}); 