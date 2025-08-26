import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";

// Initialize Firebase Admin
initializeApp();

/**
 * Health check endpoint for Cloud Functions
 */
export const healthCheck = onRequest(async (req, res) => {
  logger.info("Health check requested", { structuredData: true });
  
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');
  
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "vita-tea-functions"
  });
});

/**
 * Configuration endpoint to securely serve Firebase config to client
 * Note: Firebase API keys are designed to be public for client apps
 */
export const config = onRequest(async (req, res) => {
  logger.info("Config requested", { structuredData: true });
  
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
  
  // These Firebase config values are safe to expose publicly
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBh4BNjpxfY_dgt3FojKFMD7KEIisf1iWg",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "vida-tea.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "vida-tea", 
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "vida-tea.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "669969532716",
    appId: process.env.FIREBASE_APP_ID || "1:669969532716:web:02d938f0e13f73575f0e89",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-SS8PB0TT8D"
  };
  
  res.status(200).json(firebaseConfig);
});