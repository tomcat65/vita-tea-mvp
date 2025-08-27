# Security Rules Testing

This directory contains comprehensive security rule tests for Firebase Firestore and Cloud Storage.

## Setup

1. Install dependencies:

```bash
cd tests
npm install
```

2. Start Firebase emulators:

```bash
firebase emulators:start --only firestore,storage
```

## Running Tests

Run all security tests:

```bash
npm test
```

Run specific test suites:

```bash
npm run test:firestore  # Firestore rules only
npm run test:storage    # Storage rules only
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Test Coverage

### Firestore Rules Tests

- **Products Collection**: Read access (public), write access (admin only)
- **Certifications Collection**: Read access (public), write access (admin only)
- **Users Collection**: Read/write access (own profile only)
- **Carts Collection**: Read/write access (own cart only)
- **Orders Collection**: Read (own orders), create (own orders), update (own orders + admin)

### Storage Rules Tests

- **Product Images**: Read access (public), write access (authenticated users)
- **User Files**: Read/write access (own files only)
- **Certification Documents**: Read access (public), write access (admin only)
- **Path Validation**: Ensures access only to defined paths

## Writing New Tests

When adding new security rules, follow these patterns:

1. Test both positive (allowed) and negative (denied) cases
2. Test authenticated vs unauthenticated access
3. Test different user roles (regular user vs admin)
4. Test edge cases and boundary conditions

Example test structure:

```javascript
test('Description of what should happen', async () => {
  const db = getFirestore({ uid: 'user123' }); // Authenticated user

  // Positive case - should succeed
  await testing.assertSucceeds(db.collection('collection').doc('doc').get());

  // Negative case - should fail
  await testing.assertFails(db.collection('collection').doc('doc').set({}));
});
```
