const request = require('supertest');
const createApp = require('../../src/app');

process.env.NODE_ENV = 'test';

describe('Orders Endpoints', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = createApp();

    const timestamp = Date.now();
    await request(app)
      .post('/api/auth/register')
      .send({
        email: `ordertest${timestamp}@example.com`,
        password: 'password123',
        address: '123 Test St'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: `ordertest${timestamp}@example.com`,
        password: 'password123'
      });

    token = loginRes.body.token;
  });

  describe('POST /api/orders', () => {
    test('should fail with empty cart', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          delivery_address: '123 Test St'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cart is empty');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          delivery_address: '123 Test St'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/orders', () => {
    test('should get user orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should filter by status', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ status: 'pending' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });
});