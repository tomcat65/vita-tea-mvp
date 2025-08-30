// index.ts
import { onRequest } from 'firebase-functions/v2/https';

import { info, error, warn } from 'firebase-functions/logger';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Request, Response } from 'express';
// at the very top of functions/src/index.ts (before initializeApp)
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.vida-tea' });

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
  'https://admin.vita-tea.com', 
];

// In development, also allow localhost
if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:5000', 'http://localhost:5173');
}

/** Configure CORS headers for the response */
function setCorsHeaders(req: Request, res: Response) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else if (!origin && process.env.NODE_ENV === 'development') {
    res.set('Access-Control-Allow-Origin', '*');
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
}

/** Health check */
export const healthCheck = onRequest(async (req, res) => {
  info('Health check requested', { structuredData: true });

  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'vita-tea-functions',
  });
});

/** Public config */
export const config = onRequest(async (req, res) => {
  info('Config requested', { structuredData: true });

  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

  res.set('Cache-Control', 'public, max-age=300');

  try {
    // Use env if present; otherwise fall back to the public client config (safe for Firebase Web)
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyBh4BNjpxfY_dgt3FojKFMD7KEIisf1iWg',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'vida-tea.firebaseapp.com',
      projectId: process.env.FIREBASE_PROJECT_ID || 'vida-tea',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'vida-tea.firebasestorage.app',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '669969532716',
      appId: process.env.FIREBASE_APP_ID || '1:669969532716:web:02d938f0e13f73575f0e89',
      measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-SS8PB0TT8D',
    };

    res.status(200).json(firebaseConfig);
  } catch (err) {
    error('Error serving config', err as any);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  /** Analytics tracking */
  export const trackAnalytics = onRequest(async (req, res) => {
    info('Analytics event received', { method: req.method });

  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const { events } = req.body;
    if (!events || !Array.isArray(events)) {
      res.status(400).json({ error: 'Invalid request: events array required' });
      return;
    }

    const writes = events.map(async (event: any) => {
      if (!event.eventName || !event.eventData) {
        warn('Invalid event structure', event);
        return;
      }
      const analyticsDoc = {
        eventName: event.eventName,
        eventData: event.eventData,
        serverTimestamp: FieldValue.serverTimestamp(),
        receivedAt: new Date(),
      };
      return db.collection('analytics').add(analyticsDoc);
    });

    await Promise.all(writes);
    info('Analytics events saved', { count: events.length });
    res.status(200).json({ success: true, message: `${events.length} events tracked successfully` });
  } catch (err) {
    error('Error tracking analytics', err);
    res.status(500).json({ error: 'Failed to track analytics events' });
  }
});



/** ✅ HTTP endpoint to create user profile (called from client after auth) */
export const createUserProfile = onRequest(async (req, res) => {
  info('Create user profile requested', { method: req.method });

  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, displayName } = decodedToken;

    // Check if user profile already exists
    const existingProfile = await db.collection('users').doc(uid).get();
    if (existingProfile.exists) {
      res.status(200).json({ success: true, message: 'User profile already exists' });
      return;
    }

    // Create user profile in Firestore
    const userProfile = {
      uid,
      email: email || '',
      displayName: displayName || '',
      role: 'customer',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      preferences: { marketingEmails: true, orderNotifications: true },
      emailVerified: decodedToken.email_verified || false,
    };

    await db.collection('users').doc(uid).set(userProfile);
    info('User profile created successfully', { uid });
    res.status(201).json({ success: true, message: 'User profile created' });
  } catch (err) {
    error('Error creating user profile', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** Set custom claims for admin users */
export const setAdminRole = onRequest(async (req, res) => {
  info('Admin role request', { method: req.method });

  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    if (!decodedToken.admin) {
      res.status(403).json({ error: 'Forbidden: Only admins can set admin roles' });
      return;
    }

    const { uid } = req.body as { uid?: string };
    if (!uid) {
      res.status(400).json({ error: 'Missing uid parameter' });
      return;
    }

    await auth.setCustomUserClaims(uid, { admin: true });
    await db.collection('users').doc(uid).update({ role: 'admin', updatedAt: new Date() });

    res.status(200).json({ success: true, message: 'Admin role granted' });
  } catch (err) {
    error('Error setting admin role', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
