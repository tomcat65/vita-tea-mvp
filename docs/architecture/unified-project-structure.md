# Unified Project Structure

## Directory Layout

```
vita-tea-mvp/
├── public/                    # All static files (served directly)
│   ├── index.html            # Main entry point
│   ├── *.html                # All page files
│   ├── css/                  # Styles
│   │   └── main.css         # Tailwind via CDN + custom
│   ├── js/                   # JavaScript modules
│   │   ├── app.js           # Main application
│   │   ├── firebase-config.js # Firebase setup
│   │   ├── services/        # Service layer
│   │   ├── components/      # Web Components
│   │   └── utils/           # Helpers
│   └── assets/              # Static resources
├── functions/                # Cloud Functions (TypeScript)
│   ├── src/
│   └── package.json
├── firebase.json            # Firebase config
├── firestore.rules         # Security rules
├── storage.rules          # Storage rules
└── .firebaserc           # Project settings
```

## Module Organization

```javascript
// ES6 modules with dynamic imports for code splitting
// public/js/app.js
import { initializeFirebase } from './firebase-config.js';
import { AuthService } from './services/auth.service.js';

// Lazy load admin modules
if (window.location.pathname.startsWith('/admin')) {
  import('./admin/index.js').then(module => {
    module.initializeAdmin();
  });
}
```
