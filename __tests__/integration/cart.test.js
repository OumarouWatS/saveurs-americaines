const request = require('supertest');
const createApp = require('../../src/app');

process.env.NODE_ENV = 'test';

describe('Cart Endpoints', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = createApp();

    const timestamp = Date.now();
    // Register and login
    await request(app)
      .post('/api/auth/register')
      .send({
        email: `carttest${timestamp}@example.com`,
        password: 'password123'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: `carttest${timestamp}@example.com`,
        password: 'password123'
      });

    token = loginRes.body.token;
  });

  describe('GET /api/cart', () => {
    test('should get empty cart for new user', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    test('should require authentication', async () => {
      const response = await request(app).get('/api/cart');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/cart/summary', () => {
    test('should get cart summary', async () => {
      const response = await request(app)
        .get('/api/cart/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_items');
      expect(response.body).toHaveProperty('total');
    });
  });
});