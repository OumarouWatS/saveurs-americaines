const {
    isValidEmail,
    isValidPassword,
    isValidPrice,
    isValidRating,
    sanitizeString
  } = require('../../src/middleware/validation');
  
  describe('Validation Utilities', () => {
    describe('isValidEmail', () => {
      test('should return true for valid email', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      });
  
      test('should return false for invalid email', () => {
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('test@')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('')).toBe(false);
      });
    });
  
    describe('isValidPassword', () => {
      test('should return true for valid password', () => {
        expect(isValidPassword('password123')).toBe(true);
        expect(isValidPassword('123456')).toBe(true);
      });
  
      test('should return false for invalid password', () => {
        expect(isValidPassword('12345')).toBe(false);
        expect(isValidPassword('')).toBe(false);
        expect(isValidPassword(null)).toBe(false);
      });
    });
  
    describe('isValidPrice', () => {
      test('should return true for valid price', () => {
        expect(isValidPrice(10.99)).toBe(true);
        expect(isValidPrice(0.01)).toBe(true);
        expect(isValidPrice('5.50')).toBe(true);
      });
  
      test('should return false for invalid price', () => {
        expect(isValidPrice(0)).toBe(false);
        expect(isValidPrice(-5)).toBe(false);
        expect(isValidPrice('invalid')).toBe(false);
      });
    });
  
    describe('isValidRating', () => {
      test('should return true for valid rating', () => {
        expect(isValidRating(1)).toBe(true);
        expect(isValidRating(3)).toBe(true);
        expect(isValidRating(5)).toBe(true);
      });
  
      test('should return false for invalid rating', () => {
        expect(isValidRating(0)).toBe(false);
        expect(isValidRating(6)).toBe(false);
        expect(isValidRating(3.5)).toBe(false);
        expect(isValidRating('3')).toBe(false);
      });
    });
  
    describe('sanitizeString', () => {
      test('should remove dangerous characters', () => {
        expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
        expect(sanitizeString('Hello <b>World</b>')).toBe('Hello bWorld/b');
      });
  
      test('should trim whitespace', () => {
        expect(sanitizeString('  hello  ')).toBe('hello');
      });
  
      test('should handle non-string input', () => {
        expect(sanitizeString(123)).toBe(123);
        expect(sanitizeString(null)).toBe(null);
      });
    });
  });