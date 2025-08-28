"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminRole = exports.onUserCreate = exports.trackAnalytics = exports.config = exports.healthCheck = void 0;
// index.ts
const https_1 = require("firebase-functions/v2/https");
const identity_1 = require("firebase-functions/v2/identity");
const logger_1 = require("firebase-functions/logger");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
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
/** Configure CORS headers for the response */
function setCorsHeaders(req, res) {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    else if (!origin && process.env.NODE_ENV === 'development') {
        res.set('Access-Control-Allow-Origin', '*');
    }
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');
}
/** Health check */
exports.healthCheck = (0, https_1.onRequest)(async (req, res) => {
    (0, logger_1.info)('Health check requested', { structuredData: true });
    setCorsHeaders(req, res);
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
/** Public config */
exports.config = (0, https_1.onRequest)(async (req, res) => {
    (0, logger_1.info)('Config requested', { structuredData: true });
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    res.set('Cache-Control', 'public, max-age=300');
    try {
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
    }
    catch (err) {
        (0, logger_1.error)('Error serving config', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/** Analytics tracking */
exports.trackAnalytics = (0, https_1.onRequest)(async (req, res) => {
    (0, logger_1.info)('Analytics event received', { method: req.method });
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const { events } = req.body;
        if (!events || !Array.isArray(events)) {
            res.status(400).json({ error: 'Invalid request: events array required' });
            return;
        }
        const writes = events.map(async (event) => {
            if (!event.eventName || !event.eventData) {
                (0, logger_1.warn)('Invalid event structure', event);
                return;
            }
            const analyticsDoc = {
                eventName: event.eventName,
                eventData: event.eventData,
                serverTimestamp: firestore_1.FieldValue.serverTimestamp(),
                receivedAt: new Date(),
            };
            return db.collection('analytics').add(analyticsDoc);
        });
        await Promise.all(writes);
        (0, logger_1.info)('Analytics events saved', { count: events.length });
        res.status(200).json({ success: true, message: `${events.length} events tracked successfully` });
    }
    catch (err) {
        (0, logger_1.error)('Error tracking analytics', err);
        res.status(500).json({ error: 'Failed to track analytics events' });
    }
});
/** ✅ Auth trigger for new user accounts */
exports.onUserCreate = (0, identity_1.beforeUserCreated)(async (event) => {
    const user = event.data;
    if (!user) {
        (0, logger_1.error)('No user data in event');
        return;
    }
    (0, logger_1.info)('New user created', { uid: user.uid, email: user.email });
    const userProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        preferences: { marketingEmails: true, orderNotifications: true },
        emailVerified: user.emailVerified || false,
    };
    try {
        await db.collection('users').doc(user.uid).set(userProfile);
        (0, logger_1.info)('User profile created successfully', { uid: user.uid });
    }
    catch (err) {
        (0, logger_1.error)('Error creating user profile', err);
    }
});
/** Set custom claims for admin users */
exports.setAdminRole = (0, https_1.onRequest)(async (req, res) => {
    (0, logger_1.info)('Admin role request', { method: req.method });
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    const authHeader = req.headers.authorization;
    if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
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
        const { uid } = req.body;
        if (!uid) {
            res.status(400).json({ error: 'Missing uid parameter' });
            return;
        }
        await auth.setCustomUserClaims(uid, { admin: true });
        await db.collection('users').doc(uid).update({ role: 'admin', updatedAt: new Date() });
        res.status(200).json({ success: true, message: 'Admin role granted' });
    }
    catch (err) {
        (0, logger_1.error)('Error setting admin role', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
//# sourceMappingURL=index.js.map