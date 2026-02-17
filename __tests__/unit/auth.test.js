const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiration } = require('../../src/config/auth');

describe('JWT Token Generation', () => {
  test('should generate valid JWT token', () => {
    const payload = {
      id: 1,
      email: 'test@example.com',
      role: 'customer'
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiration });
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  test('should verify valid JWT token', () => {
    const payload = {
      id: 1,
      email: 'test@example.com',
      role: 'customer'
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiration });
    const decoded = jwt.verify(token, jwtSecret);

    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  test('should reject invalid JWT token', () => {
    const invalidToken = 'invalid.token.here';

    expect(() => {
      jwt.verify(invalidToken, jwtSecret);
    }).toThrow();
  });
});