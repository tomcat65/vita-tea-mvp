// Authentication Service - Wrapper around Firebase Auth
import { firebaseReady, auth } from '../firebase-config.js';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from '../firebase-config.js';
import { csrf } from '../utils/csrf.js';

// Auth error messages
const authErrors = {
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/email-already-in-use': 'An account already exists with this email',
  'auth/weak-password': 'Password should be at least 6 characters',
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/popup-closed-by-user': 'Sign in cancelled',
  'auth/unauthorized-domain': 'This domain is not authorized for sign in'
};

// Initialize providers
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  backoffMultiplier: 2,
  maxBackoffMs: 5 * 60 * 1000 // 5 minutes max
};

// Auth service
class AuthService {
  constructor() {
    this.currentUser = null;
    this.userListeners = [];
    this.initialized = false;
    this.rateLimiter = new Map(); // Track failed attempts per email
  }

  async initialize() {
    await firebaseReady;
    
    // Set persistence to local
    await setPersistence(auth, browserLocalPersistence);
    
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.notifyListeners(user);
    });
    
    this.initialized = true;
  }

  // User state listeners
  onUserChange(callback) {
    this.userListeners.push(callback);
    // Immediately call with current user
    if (this.initialized) {
      callback(this.currentUser);
    }
  }

  notifyListeners(user) {
    this.userListeners.forEach(callback => callback(user));
  }

  // Register with email/password
  async registerWithEmail(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Create user profile in Firestore
      await this.createUserProfile(user, { email, displayName });

      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: authErrors[error.code] || error.message 
      };
    }
  }

  // Sign in with email/password
  async signInWithEmail(email, password) {
    // Check rate limiting
    const rateLimitCheck = this.checkRateLimit(email);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: `Too many failed attempts. Please try again in ${Math.ceil(rateLimitCheck.retryAfterMs / 1000)} seconds.`
      };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Clear rate limit on successful login
      this.clearRateLimit(email);
      
      // Update last login
      await this.updateLastLogin(userCredential.user.uid);
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      // Record failed attempt
      this.recordFailedAttempt(email);
      
      return { 
        success: false, 
        error: authErrors[error.code] || error.message 
      };
    }
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Create/update user profile
      await this.createUserProfile(user, {
        email: user.email,
        displayName: user.displayName
      });
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: authErrors[error.code] || error.message 
      };
    }
  }

  // Sign in with Apple
  async signInWithApple() {
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const user = result.user;
      
      // Create/update user profile
      await this.createUserProfile(user, {
        email: user.email,
        displayName: user.displayName || 'Apple User'
      });
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: authErrors[error.code] || error.message 
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      // Clear CSRF token on logout
      csrf.clearToken();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: 'Failed to sign out' 
      };
    }
  }

  // Send password reset email
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: authErrors[error.code] || error.message 
      };
    }
  }

  // Create user profile in Firestore
  async createUserProfile(user, additionalData = {}) {
    const userRef = doc(db, 'users', user.uid);
    
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: additionalData.displayName || user.displayName || '',
      role: 'customer',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      preferences: {
        marketingEmails: true,
        orderNotifications: true
      },
      ...additionalData
    };

    try {
      await setDoc(userRef, userData, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Update last login timestamp
  async updateLastLogin(uid) {
    const userRef = doc(db, 'users', uid);
    try {
      await setDoc(userRef, { 
        lastLoginAt: serverTimestamp() 
      }, { merge: true });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Check if user is signed in
  isSignedIn() {
    return this.currentUser !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if email is verified
  isEmailVerified() {
    return this.currentUser && this.currentUser.emailVerified;
  }

  // Check if user has admin role via custom claims
  async isAdmin() {
    if (!this.currentUser) {
      return false;
    }
    
    try {
      const idTokenResult = await this.currentUser.getIdTokenResult();
      return idTokenResult.claims.admin === true;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Rate limiting methods
  checkRateLimit(email) {
    const now = Date.now();
    const attempts = this.rateLimiter.get(email);
    
    if (!attempts) {
      return { allowed: true };
    }
    
    // Clean up old entries
    if (now - attempts.firstAttemptTime > RATE_LIMIT_CONFIG.windowMs) {
      this.rateLimiter.delete(email);
      return { allowed: true };
    }
    
    // Check if currently in backoff period
    if (attempts.blockedUntil && now < attempts.blockedUntil) {
      return { 
        allowed: false, 
        retryAfterMs: attempts.blockedUntil - now 
      };
    }
    
    // Check if max attempts reached
    if (attempts.count >= RATE_LIMIT_CONFIG.maxAttempts) {
      const backoffTime = Math.min(
        RATE_LIMIT_CONFIG.backoffMultiplier ** (attempts.count - RATE_LIMIT_CONFIG.maxAttempts) * 1000,
        RATE_LIMIT_CONFIG.maxBackoffMs
      );
      attempts.blockedUntil = now + backoffTime;
      return { 
        allowed: false, 
        retryAfterMs: backoffTime 
      };
    }
    
    return { allowed: true };
  }
  
  recordFailedAttempt(email) {
    const now = Date.now();
    const attempts = this.rateLimiter.get(email) || {
      count: 0,
      firstAttemptTime: now
    };
    
    attempts.count++;
    attempts.lastAttemptTime = now;
    
    this.rateLimiter.set(email, attempts);
  }
  
  clearRateLimit(email) {
    this.rateLimiter.delete(email);
  }

  // Get headers with CSRF token for API calls
  getSecureHeaders(additionalHeaders = {}) {
    return csrf.addTokenToHeaders(additionalHeaders);
  }

  // Validate CSRF token
  validateCSRFToken(token) {
    return csrf.validateToken(token);
  }
}

// Export singleton instance
export const authService = new AuthService();

// Initialize on import
authService.initialize();