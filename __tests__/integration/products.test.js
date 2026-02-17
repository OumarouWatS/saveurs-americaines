const request = require('supertest');
const createApp = require('../../src/app');

process.env.NODE_ENV = 'test';

describe('Products Endpoints', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/products', () => {
    test('should get all products', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    test('should support search', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ search: 'chocolate' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    test('should support price range filter', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ min_price: 10, max_price: 50 });

      expect(response.status).toBe(200);
    });

    test('should support sorting', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ sort: 'price', order: 'ASC' });

      expect(response.status).toBe(200);
    });

    test('should reject invalid page number', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: -1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid page number');
    });

    test('should reject limit over 100', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ limit: 150 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Limit must be between 1 and 100');
    });
  });

  describe('GET /api/products/:id', () => {
    test('should return 404 for non-existent product', async () => {
      const response = await request(app).get('/api/products/99999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Product not found');
    });
  });
});