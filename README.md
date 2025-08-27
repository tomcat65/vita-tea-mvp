# Vita Tea MVP

Premium tea e-commerce platform built with Firebase.

## Quick Start

### Prerequisites

- Node.js 18+
- Java 17+ (for Firebase emulators)
- Firebase CLI

### Installation

1. **Install Java** (required for Firebase emulators):
   ```bash
   sudo apt install openjdk-17-jre-headless
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd functions && npm install
   ```

3. **Set up Firebase**:
   ```bash
   firebase login
   firebase use demo-vita-tea
   ```

### Development

**Start Firebase emulators**:
```bash
npm run dev
```

**Lint code**:
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

**Format code**:
```bash
npm run format
npm run format:check
```

**Build functions**:
```bash
npm run build
```

**Deploy**:
```bash
npm run deploy
```

## Project Structure

```
vita-tea-mvp/
├── public/                    # Static files (served directly)
│   ├── index.html            # Main entry point
│   ├── css/                  # Styles
│   └── js/                   # JavaScript modules
├── functions/                # Cloud Functions (TypeScript)
│   ├── src/
│   └── package.json
├── firebase.json            # Firebase config
├── firestore.rules         # Security rules
├── storage.rules          # Storage rules
└── .firebaserc           # Project settings
```

## Code Quality

- **ESLint**: Code linting for JavaScript and TypeScript
- **Prettier**: Code formatting
- **TypeScript**: Type safety for Cloud Functions

## Environment Setup

- **Development**: `demo-vita-tea` (Firebase project)
- **Staging**: TBD
- **Production**: TBD

## Testing

```bash
# Run security rules tests
cd tests && npm test
```

## Deployment

The project uses GitHub Actions for CI/CD. Push to `main` branch to trigger deployment.

## Architecture

See [docs/architecture/](docs/architecture/) for detailed architecture documentation.
