/**
 * Security rules test suite for Cloud Storage
 * Tests authentication and authorization rules for storage buckets
 */

const testing = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

// Load the rules file
const rulesFile = fs.readFileSync(
  path.resolve(__dirname, '../../storage.rules'),
  'utf8'
);

// Test project ID
const PROJECT_ID = 'test-vita-tea';

// Helper to create test app
function getStorage(auth) {
  return testing.initializeTestApp({ projectId: PROJECT_ID, auth }).storage();
}

// Clean up test environment
afterEach(async () => {
  await testing.cleanup();
});

beforeAll(async () => {
  await testing.loadStorageRules({ projectId: PROJECT_ID, rules: rulesFile });
});

describe('Product Images Storage Rules', () => {
  test('Anyone can read product images', async () => {
    const storage = getStorage(null); // Unauthenticated
    const file = storage.ref('products/test-image.jpg');
    await testing.assertSucceeds(file.getDownloadURL());
  });

  test('Only authenticated users can upload product images', async () => {
    const authStorage = getStorage({ uid: 'user123' });
    const unauthStorage = getStorage(null);

    const testData = Buffer.from('fake image data');

    // Authenticated can write
    await testing.assertSucceeds(
      authStorage.ref('products/new-image.jpg').put(testData)
    );

    // Unauthenticated cannot write
    await testing.assertFails(
      unauthStorage.ref('products/new-image.jpg').put(testData)
    );
  });
});

describe('User Files Storage Rules', () => {
  test('Users can only access their own files', async () => {
    const userId = 'user123';
    const userStorage = getStorage({ uid: userId });
    const otherStorage = getStorage({ uid: 'other-user' });

    const testData = Buffer.from('user file data');

    // Can read/write own files
    await testing.assertSucceeds(
      userStorage.ref(`users/${userId}/profile.jpg`).put(testData)
    );
    await testing.assertSucceeds(
      userStorage.ref(`users/${userId}/profile.jpg`).getDownloadURL()
    );

    // Cannot access other user files
    await testing.assertFails(
      otherStorage.ref(`users/${userId}/profile.jpg`).getDownloadURL()
    );
    await testing.assertFails(
      otherStorage.ref(`users/${userId}/profile.jpg`).put(testData)
    );
  });

  test('Unauthenticated users cannot access user files', async () => {
    const storage = getStorage(null);
    const testData = Buffer.from('user file data');

    await testing.assertFails(
      storage.ref('users/user123/profile.jpg').getDownloadURL()
    );
    await testing.assertFails(
      storage.ref('users/user123/profile.jpg').put(testData)
    );
  });
});

describe('Certification Documents Storage Rules', () => {
  test('Anyone can read certification documents', async () => {
    const storage = getStorage(null);
    const file = storage.ref('certifications/organic-cert.pdf');
    await testing.assertSucceeds(file.getDownloadURL());
  });

  test('Only admin users can upload certification documents', async () => {
    const adminStorage = getStorage({ uid: 'admin-user', admin: true });
    const userStorage = getStorage({ uid: 'regular-user' });
    const unauthStorage = getStorage(null);

    const testData = Buffer.from('certification document');

    // Admin can write
    await testing.assertSucceeds(
      adminStorage.ref('certifications/new-cert.pdf').put(testData)
    );

    // Regular user cannot write
    await testing.assertFails(
      userStorage.ref('certifications/new-cert.pdf').put(testData)
    );

    // Unauthenticated cannot write
    await testing.assertFails(
      unauthStorage.ref('certifications/new-cert.pdf').put(testData)
    );
  });
});

describe('Storage Path Validation', () => {
  test('Cannot access files outside defined paths', async () => {
    const adminStorage = getStorage({ uid: 'admin-user', admin: true });
    const testData = Buffer.from('test data');

    // These paths should fail even for admin
    await testing.assertFails(
      adminStorage.ref('random-path/file.txt').put(testData)
    );
    await testing.assertFails(adminStorage.ref('file.txt').put(testData));
  });
});
