# Firebase Functions

This directory contains the Firebase Cloud Functions for the Vita Tea MVP project.

## 🔒 Environment Variables

**IMPORTANT**: Never commit API keys or sensitive configuration to version control!

### Setup Environment Variables

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your Firebase configuration:**
   ```bash
   # Get these values from your Firebase Console
   FIREBASE_API_KEY=your_actual_api_key_here
   FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

### Setting Environment Variables in Firebase

For production deployment, set environment variables in Firebase:

```bash
# Set environment variables for your Firebase project
firebase functions:config:set firebase.api_key="your_api_key"
firebase functions:config:set firebase.auth_domain="your_project_id.firebaseapp.com"
firebase functions:config:set firebase.project_id="your_project_id"
firebase functions:config:set firebase.storage_bucket="your_project_id.firebasestorage.app"
firebase functions:config:set firebase.messaging_sender_id="your_messaging_sender_id"
firebase functions:config:set firebase.app_id="your_app_id"
firebase functions:config:set firebase.measurement_id="your_measurement_id"
```

## 🚀 Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run locally
npm run serve

# Deploy to Firebase
npm run deploy
```

## 📋 Available Functions

- `healthCheck` - Health check endpoint
- `config` - Returns Firebase configuration (for client-side)
- `trackAnalytics` - Tracks analytics events
- `onUserCreate` - Creates user profile when new user signs up
- `setAdminRole` - Sets admin role for users (admin only)

## 🔐 Security Notes

- API keys are now properly secured using environment variables
- The `config` function validates all required environment variables
- Admin functions require proper authentication
- CORS is configured for allowed origins only
