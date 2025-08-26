# Deployment Architecture

## Environments

```javascript
// public/js/config/environment.js
const ENV = {
  development: {
    firebaseConfig: { /* dev config */ },
    stripePublicKey: 'pk_test_...',
    analyticsEnabled: false
  },
  staging: {
    firebaseConfig: { /* staging config */ },
    stripePublicKey: 'pk_test_...',
    analyticsEnabled: true
  },
  production: {
    firebaseConfig: { /* prod config */ },
    stripePublicKey: 'pk_live_...',
    analyticsEnabled: true
  }
};

export const config = ENV[window.location.hostname] || ENV.production;
```

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci --prefix functions
      - run: npm test --prefix functions
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: ${{ github.event.pull_request && 'pr-preview' || 'live' }}
```

## Rollback Strategy

```bash
# List recent deployments
firebase hosting:releases:list

# Rollback to previous version
firebase hosting:rollback

# Or rollback Functions
firebase functions:delete myFunction --force
firebase deploy --only functions:myFunction
```
