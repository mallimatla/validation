/**
 * Jest Test Setup
 * Global test configuration
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.AGENT_SIGNING_SECRET = 'test-secret';

// Extend Jest expect timeout
jest.setTimeout(30000);
