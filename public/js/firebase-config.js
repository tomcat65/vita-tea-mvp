// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Firebase configuration loaded from environment variables via config endpoint
let firebaseConfig = {};

// Load configuration from secure endpoint with error handling
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`Config API returned ${response.status}: ${response.statusText}`);
    }
    firebaseConfig = await response.json();
    
    // Validate required config fields
    const requiredFields = ['apiKey', 'authDomain', 'projectId'];
    const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required config fields: ${missingFields.join(', ')}`);
    }
  } catch (error) {
    console.error('Failed to load Firebase config:', error);
    // Display user-friendly error message
    document.body.innerHTML = `
      <div style="text-align: center; padding: 50px; font-family: sans-serif;">
        <h1>Configuration Error</h1>
        <p>Unable to load application configuration.</p>
        <p>Please refresh the page or contact support if the problem persists.</p>
        <button onclick="location.reload()">Refresh Page</button>
      </div>
    `;
    throw new Error('Firebase configuration not available');
  }
}

// Initialize Firebase app and services
let app, db, auth, storage;

async function initFirebase() {
  await loadConfig();
  
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase services
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
}

// Export promise that resolves when Firebase is ready
export const firebaseReady = initFirebase();

// Export initialized services (use after firebaseReady resolves)
export { db, auth, storage, app };