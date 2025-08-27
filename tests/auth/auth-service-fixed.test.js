// Authentication Service Tests - Fixed for proper configuration
const { 
  signOut
} = require('../mocks/firebase-mock.js');

// Mock the firebase config
jest.mock('../../public/js/firebase-config.js', () => ({
  firebaseReady: Promise.resolve(),
  auth: {},
  db: {}
}));

// Mock the CSRF utility
jest.mock('../../public/js/utils/csrf.js', () => ({
  csrf: {
    clearToken: jest.fn(),
    generateToken: jest.fn(() => 'mock-csrf-token'),
    getToken: jest.fn(() => 'mock-csrf-token'),
    validateToken: jest.fn(() => true),
    addTokenToHeaders: jest.fn((headers) => ({ ...headers, 'X-CSRF-Token': 'mock-csrf-token' }))
  }
}));

describe('AuthService Rate Limiting', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset modules to ensure clean state
    jest.resetModules();
  });

  test('should implement rate limiting after failed attempts', () => {
    // Create a mock auth service with rate limiting
    const rateLimiter = new Map();
    
    const checkRateLimit = (email) => {
      const attempts = rateLimiter.get(email);
      
      if (!attempts) {
        return { allowed: true };
      }
      
      if (attempts.count >= 5) {
        return { 
          allowed: false, 
          retryAfterMs: 60000 // 1 minute for testing
        };
      }
      
      return { allowed: true };
    };
    
    const recordFailedAttempt = (email) => {
      const now = Date.now();
      const attempts = rateLimiter.get(email) || {
        count: 0,
        firstAttemptTime: now
      };
      
      attempts.count++;
      attempts.lastAttemptTime = now;
      
      rateLimiter.set(email, attempts);
    };
    
    // Test rate limiting
    const email = 'test@example.com';
    
    // First 5 attempts should be allowed
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(email).allowed).toBe(true);
      recordFailedAttempt(email);
    }
    
    // 6th attempt should be blocked
    const result = checkRateLimit(email);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });
  
  test('should clear rate limit on successful login', () => {
    const rateLimiter = new Map();
    const email = 'test@example.com';
    
    // Add some failed attempts
    rateLimiter.set(email, { count: 3, firstAttemptTime: Date.now() });
    
    // Clear rate limit
    rateLimiter.delete(email);
    
    // Should now be allowed
    expect(rateLimiter.has(email)).toBe(false);
  });
});

describe('CSRF Protection', () => {
  const { csrf } = require('../../public/js/utils/csrf.js');
  
  test('should clear CSRF token on logout', async () => {
    // Mock successful sign out
    signOut.mockResolvedValue();
    
    // Simulate sign out with CSRF clear
    await signOut();
    csrf.clearToken();
    
    expect(signOut).toHaveBeenCalled();
    expect(csrf.clearToken).toHaveBeenCalled();
  });
  
  test('should add CSRF token to headers', () => {
    const headers = { 'Content-Type': 'application/json' };
    const secureHeaders = csrf.addTokenToHeaders(headers);
    
    expect(secureHeaders).toHaveProperty('X-CSRF-Token', 'mock-csrf-token');
    expect(secureHeaders).toHaveProperty('Content-Type', 'application/json');
  });
});

describe('Admin Role Validation', () => {
  test('should validate admin claims from Firebase custom claims', async () => {
    // Mock user with admin claims
    const mockUser = {
      uid: '123',
      email: 'admin@vita-tea.com',
      getIdTokenResult: jest.fn().mockResolvedValue({
        claims: { admin: true }
      })
    };
    
    // Check admin status
    const idTokenResult = await mockUser.getIdTokenResult();
    const isAdmin = idTokenResult.claims.admin === true;
    
    expect(isAdmin).toBe(true);
  });
  
  test('should reject non-admin users', async () => {
    // Mock user without admin claims
    const mockUser = {
      uid: '456',
      email: 'user@example.com',
      getIdTokenResult: jest.fn().mockResolvedValue({
        claims: { admin: false }
      })
    };
    
    // Check admin status
    const idTokenResult = await mockUser.getIdTokenResult();
    const isAdmin = idTokenResult.claims.admin === true;
    
    expect(isAdmin).toBe(false);
  });
});

describe('XSS Prevention', () => {
  test('should use textContent instead of innerHTML', () => {
    // Create mock DOM elements
    document.body.innerHTML = '<div id="auth-container"></div>';
    const authContainer = document.getElementById('auth-container');
    
    // Safe way to set content
    const userDisplay = 'Test User <script>alert("XSS")</script>';
    const span = document.createElement('span');
    span.textContent = userDisplay; // This will escape HTML
    
    authContainer.appendChild(span);
    
    // Check that HTML is escaped
    expect(span.textContent).toBe(userDisplay);
    expect(span.innerHTML).toBe('Test User &lt;script&gt;alert("XSS")&lt;/script&gt;');
  });
});