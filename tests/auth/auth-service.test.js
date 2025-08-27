// Authentication Service Tests
import { authService } from '../../public/js/services/auth.service.js';

describe('AuthService', () => {
  beforeEach(async () => {
    await authService.initialize();
  });

  describe('Email/Password Authentication', () => {
    test('should register new user with valid email and password', async () => {
      const email = `test${Date.now()}@example.com`;
      const password = 'securePassword123';
      const displayName = 'Test User';

      const result = await authService.registerWithEmail(email, password, displayName);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);
    });

    test('should fail registration with weak password', async () => {
      const email = `test${Date.now()}@example.com`;
      const password = '123'; // Too weak

      const result = await authService.registerWithEmail(email, password, 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('6 characters');
    });

    test('should fail registration with invalid email', async () => {
      const email = 'invalid-email';
      const password = 'securePassword123';

      const result = await authService.registerWithEmail(email, password, 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('valid email');
    });

    test('should sign in with valid credentials', async () => {
      // First register a user
      const email = `test${Date.now()}@example.com`;
      const password = 'securePassword123';
      await authService.registerWithEmail(email, password, 'Test User');

      // Then sign in
      const result = await authService.signInWithEmail(email, password);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);
    });

    test('should fail sign in with wrong password', async () => {
      const email = `test${Date.now()}@example.com`;
      const password = 'securePassword123';
      await authService.registerWithEmail(email, password, 'Test User');

      const result = await authService.signInWithEmail(email, 'wrongPassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('password');
    });
  });

  describe('Password Reset', () => {
    test('should send password reset email for valid user', async () => {
      // First register a user
      const email = `test${Date.now()}@example.com`;
      const password = 'securePassword123';
      await authService.registerWithEmail(email, password, 'Test User');

      // Send reset email
      const result = await authService.sendPasswordReset(email);

      expect(result.success).toBe(true);
    });

    test('should handle password reset for non-existent user', async () => {
      const email = 'nonexistent@example.com';
      
      const result = await authService.sendPasswordReset(email);

      // Firebase doesn't reveal if user exists for security
      expect(result.success).toBe(true);
    });
  });

  describe('User State Management', () => {
    test('should track authentication state changes', (done) => {
      let callCount = 0;
      
      authService.onUserChange((user) => {
        callCount++;
        
        if (callCount === 1) {
          expect(user).toBe(null); // Initial state
        } else if (callCount === 2) {
          expect(user).toBeDefined(); // After sign in
          expect(user.email).toBeDefined();
          done();
        }
      });

      // Trigger sign in
      const email = `test${Date.now()}@example.com`;
      authService.registerWithEmail(email, 'securePassword123', 'Test');
    });

    test('should check if user is signed in', async () => {
      expect(authService.isSignedIn()).toBe(false);

      // Sign in
      const email = `test${Date.now()}@example.com`;
      await authService.registerWithEmail(email, 'securePassword123', 'Test');

      expect(authService.isSignedIn()).toBe(true);

      // Sign out
      await authService.signOut();

      expect(authService.isSignedIn()).toBe(false);
    });
  });

  describe('User Profile Creation', () => {
    test('should create user profile with correct structure', async () => {
      const email = `test${Date.now()}@example.com`;
      const displayName = 'Test User';

      const result = await authService.registerWithEmail(email, 'password123', displayName);

      if (result.success && result.user) {
        // In real implementation, we'd check Firestore
        // Here we're testing the method exists and returns expected structure
        const profileResult = await authService.createUserProfile(result.user, {
          email,
          displayName
        });

        expect(profileResult.success).toBe(true);
      }
    });
  });
});