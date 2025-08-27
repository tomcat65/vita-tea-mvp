# Testing Firestore Security Rules

## Overview

The security rules tests require the Firebase Emulator Suite to be running. These tests validate that our security rules properly enforce authentication, authorization, and data validation.

## Prerequisites

1. Firebase CLI installed globally
2. Firebase project configured
3. Emulator suite installed

## Running the Tests

### 1. Start Firebase Emulators

In one terminal, start the Firebase emulators:

```bash
# From project root
firebase emulators:start --only firestore
```

The emulator will start on:
- Firestore: http://localhost:8080
- Emulator UI: http://localhost:4000

### 2. Run Security Rules Tests

In another terminal, run the tests:

```bash
# From project root
cd tests
npm test -- --testPathPattern=firestore.rules.test.js
```

### 3. Manual Testing with Emulator UI

You can also manually test the rules using the Emulator UI:

1. Navigate to http://localhost:4000
2. Go to the Firestore tab
3. Try creating/reading/updating documents with different auth states
4. The rules will be applied as configured in `firestore.rules`

## Test Coverage

The test suite covers:

1. **Products Collection**
   - Public read access for active products
   - Admin-only access for inactive products
   - Data validation for required fields and types
   - Rate limiting on updates

2. **Users Collection**
   - Owner-only read/write access
   - Email validation
   - Role restrictions (users cannot set admin role)
   - Prevention of uid/role changes on update

3. **Carts Collection**
   - Owner-only access
   - Cart data structure validation
   - Rate limiting on updates

4. **Orders Collection**
   - Owner read access
   - Admin-only updates
   - Prevention of direct creation (Cloud Functions only)
   - Order data validation

5. **Addresses Collection**
   - Owner access control
   - Address type validation
   - Prevention of userId changes

6. **Admin-Only Collections**
   - InventoryLogs: Admin read, no direct writes
   - OrderEvents: Owner/admin read based on order ownership
   - Analytics: Admin read, no direct writes

## Debugging Failed Tests

If tests fail:

1. **Check Emulator Status**
   - Ensure emulator is running on correct ports
   - Check emulator logs for errors

2. **Verify Rules Syntax**
   - Rules file has correct syntax
   - All helper functions are defined
   - No typos in collection/field names

3. **Test Data Issues**
   - Ensure test data matches expected schema
   - Check timestamp formats
   - Verify required fields are present

4. **Authentication Context**
   - Verify auth tokens have correct structure
   - Check custom claims (e.g., admin: true)
   - Ensure uid matches document references

## CI/CD Integration

For continuous integration:

```yaml
# .github/workflows/test-security.yml
name: Security Rules Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Firebase Tools
        run: npm install -g firebase-tools
      
      - name: Install dependencies
        run: |
          cd tests
          npm ci
      
      - name: Run Security Rules Tests
        run: |
          cd tests
          firebase emulators:exec --only firestore --project test-vita-tea \
            'npm test -- --testPathPattern=firestore.rules.test.js'
```

## Local Development Workflow

1. Make changes to `firestore.rules`
2. Run tests to verify changes
3. If tests fail, check error messages
4. Update tests if new rules are added
5. Deploy rules only after all tests pass

```bash
# Deploy rules after testing
firebase deploy --only firestore:rules
```