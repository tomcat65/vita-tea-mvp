import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin
initializeApp();
const auth = getAuth();
const db = getFirestore();

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://vita-tea.com',
  'https://www.vita-tea.com',
  'https://vida-tea.web.app',
  'https://vida-tea.firebaseapp.com',
];

// In development, also allow localhost
if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:5000');
}

/**
 * Configure CORS headers for the response
 */
function setCorsHeaders(req: any, res: any) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else if (!origin && process.env.NODE_ENV === 'development') {
    // Allow no-origin requests in development (e.g., Postman)
    res.set('Access-Control-Allow-Origin', '*');
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
}

/**
 * Health check endpoint for Cloud Functions
 */
export const healthCheck = onRequest(async (req, res) => {
  logger.info('Health check requested', { structuredData: true });

  // Handle CORS
  setCorsHeaders(req, res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'vita-tea-functions',
  });
});

/**
 * Configuration endpoint to securely serve Firebase config to client
 * Note: Firebase API keys are designed to be public for client apps
 */
export const config = onRequest(async (req, res) => {
  logger.info('Config requested', { structuredData: true });

  // Handle CORS
  setCorsHeaders(req, res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Set caching headers
  res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

  try {
    // These Firebase config values are safe to expose publicly
    const firebaseConfig = {
      apiKey:
        process.env.FIREBASE_API_KEY ||
        'AIzaSyBh4BNjpxfY_dgt3FojKFMD7KEIisf1iWg',
      authDomain:
        process.env.FIREBASE_AUTH_DOMAIN || 'vida-tea.firebaseapp.com',
      projectId: process.env.FIREBASE_PROJECT_ID || 'vida-tea',
      storageBucket:
        process.env.FIREBASE_STORAGE_BUCKET || 'vida-tea.firebasestorage.app',
      messagingSenderId:
        process.env.FIREBASE_MESSAGING_SENDER_ID || '669969532716',
      appId:
        process.env.FIREBASE_APP_ID ||
        '1:669969532716:web:02d938f0e13f73575f0e89',
      measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-SS8PB0TT8D',
    };

    res.status(200).json(firebaseConfig);
  } catch (error) {
    logger.error('Error serving config', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * onCreate trigger for new user accounts
 * Creates user profile document when a new user signs up
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  logger.info('New user created', { uid: user.uid, email: user.email });
  
  // Create user profile document
  const userProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    role: 'customer',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
    preferences: {
      marketingEmails: true,
      orderNotifications: true
    },
    emailVerified: user.emailVerified || false
  };
  
  try {
    await db.collection('users').doc(user.uid).set(userProfile);
    logger.info('User profile created successfully', { uid: user.uid });
  } catch (error) {
    logger.error('Error creating user profile', error);
  }
});

/**
 * Set custom claims for admin users
 * This would be called by a secure admin interface
 */
export const setAdminRole = onRequest(async (req, res) => {
  logger.info('Admin role request', { method: req.method });
  
  // Handle CORS
  setCorsHeaders(req, res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  // This should only be accessible by existing admins
  // For initial setup, you might need to run this via Firebase Admin SDK directly
  
  // Verify the request is authenticated
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Check if the requester is already an admin
    if (!decodedToken.admin) {
      res.status(403).json({ error: 'Forbidden: Only admins can set admin roles' });
      return;
    }
    
    const { uid } = req.body;
    if (!uid) {
      res.status(400).json({ error: 'Missing uid parameter' });
      return;
    }
    
    // Set custom claims
    await auth.setCustomUserClaims(uid, { admin: true });
    
    // Update user document
    await db.collection('users').doc(uid).update({
      role: 'admin',
      updatedAt: new Date()
    });
    
    res.status(200).json({ success: true, message: 'Admin role granted' });
  } catch (error) {
    logger.error('Error setting admin role', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
