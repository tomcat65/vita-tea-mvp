"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminRole = exports.onUserCreate = exports.trackAnalytics = exports.config = exports.healthCheck = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const functions = require("firebase-functions");
// Initialize Firebase Admin
(0, app_1.initializeApp)();
const auth = (0, auth_1.getAuth)();
const db = (0, firestore_1.getFirestore)();
// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    'https://vita-tea.com',
    'https://www.vita-tea.com',
    'https://vida-tea.web.app',
    'https://vida-tea.firebaseapp.com',
];
// In development, also allow localhost
if (process.env.NODE_ENV === 'development') {
    ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:5000', 'http://localhost:5173');
}
/**
 * Configure CORS headers for the response
 */
function setCorsHeaders(req, res) {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    else if (!origin && process.env.NODE_ENV === 'development') {
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
exports.healthCheck = (0, https_1.onRequest)(async (req, res) => {
    firebase_functions_1.logger.info('Health check requested', { structuredData: true });
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
exports.config = (0, https_1.onRequest)(async (req, res) => {
    firebase_functions_1.logger.info('Config requested', { structuredData: true });
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
            apiKey: process.env.FIREBASE_API_KEY ||
                'AIzaSyBh4BNjpxfY_dgt3FojKFMD7KEIisf1iWg',
            authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'vida-tea.firebaseapp.com',
            projectId: process.env.FIREBASE_PROJECT_ID || 'vida-tea',
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'vida-tea.firebasestorage.app',
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '669969532716',
            appId: process.env.FIREBASE_APP_ID ||
                '1:669969532716:web:02d938f0e13f73575f0e89',
            measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-SS8PB0TT8D',
        };
        res.status(200).json(firebaseConfig);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error serving config', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * Analytics tracking endpoint
 * Receives analytics events from the client and writes them to Firestore
 */
exports.trackAnalytics = (0, https_1.onRequest)(async (req, res) => {
    firebase_functions_1.logger.info('Analytics event received', { method: req.method });
    // Handle CORS
    setCorsHeaders(req, res);
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    // Only accept POST requests
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        // Get the events from request body
        const { events } = req.body;
        if (!events || !Array.isArray(events)) {
            res.status(400).json({ error: 'Invalid request: events array required' });
            return;
        }
        // Validate and write each event
        const promises = events.map(async (event) => {
            if (!event.eventName || !event.eventData) {
                firebase_functions_1.logger.warn('Invalid event structure', event);
                return;
            }
            // Add server timestamp and write to Firestore
            const analyticsDoc = {
                eventName: event.eventName,
                eventData: event.eventData,
                serverTimestamp: firestore_1.FieldValue.serverTimestamp(),
                receivedAt: new Date()
            };
            return db.collection('analytics').add(analyticsDoc);
        });
        await Promise.all(promises);
        firebase_functions_1.logger.info('Analytics events saved', { count: events.length });
        res.status(200).json({
            success: true,
            message: `${events.length} events tracked successfully`
        });
    }
    catch (error) {
        firebase_functions_1.logger.error('Error tracking analytics', error);
        res.status(500).json({ error: 'Failed to track analytics events' });
    }
});
/**
 * onCreate trigger for new user accounts
 * Creates user profile document when a new user signs up
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    firebase_functions_1.logger.info('New user created', { uid: user.uid, email: user.email });
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
        firebase_functions_1.logger.info('User profile created successfully', { uid: user.uid });
    }
    catch (error) {
        firebase_functions_1.logger.error('Error creating user profile', error);
    }
});
/**
 * Set custom claims for admin users
 * This would be called by a secure admin interface
 */
exports.setAdminRole = (0, https_1.onRequest)(async (req, res) => {
    firebase_functions_1.logger.info('Admin role request', { method: req.method });
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
    }
    catch (error) {
        firebase_functions_1.logger.error('Error setting admin role', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
//# sourceMappingURL=index.js.map