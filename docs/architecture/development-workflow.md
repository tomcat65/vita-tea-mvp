# Development Workflow

## Local Development Setup

```bash
# 1. Install Firebase CLI globally
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Initialize project
firebase init
# Select: Hosting, Functions, Firestore, Storage, Emulators

# 4. Start local development
firebase emulators:start --import=./data --export-on-exit

# 5. Deploy to production
firebase deploy
```

## Development Tools

```javascript
// firebase.json - Emulator configuration
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 },
    "hosting": { "port": 5000 },
    "storage": { "port": 9199 }
  },
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      }
    ]
  }
}
```

## Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/add-tea-subscription
git add .
git commit -m "feat: add tea subscription feature"
git push origin feature/add-tea-subscription

# Deploy preview
firebase hosting:channel:deploy preview-subscription
```
