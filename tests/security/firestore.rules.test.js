/**
 * Security rules test suite for Firestore
 * Tests authentication and authorization rules for all collections
 */

const testing = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

// Load the rules file
const rulesFile = fs.readFileSync(
  path.resolve(__dirname, '../../firestore.rules'),
  'utf8'
);

// Test project ID
const PROJECT_ID = 'test-vita-tea';

// Helper to create test app
function getFirestore(auth) {
  return testing.initializeTestApp({ projectId: PROJECT_ID, auth }).firestore();
}

// Helper to create admin app
function getAdminFirestore() {
  return testing.initializeAdminApp({ projectId: PROJECT_ID }).firestore();
}

// Clean up test environment
beforeEach(async () => {
  await testing.clearFirestoreData({ projectId: PROJECT_ID });
});

afterEach(async () => {
  await testing.cleanup();
});

beforeAll(async () => {
  await testing.loadFirestoreRules({ projectId: PROJECT_ID, rules: rulesFile });
});

describe('Products Collection Security Rules', () => {
  test('Anyone can read products', async () => {
    const db = getFirestore(null); // Unauthenticated
    const testDoc = db.collection('products').doc('test-product');
    await testing.assertSucceeds(testDoc.get());
  });

  test('Only admin users can write to products', async () => {
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    const userDb = getFirestore({ uid: 'regular-user' });
    const unauthDb = getFirestore(null);

    const productData = { name: 'Test Tea', price: 20 };

    // Admin can write
    await testing.assertSucceeds(
      adminDb.collection('products').doc('test-product').set(productData)
    );

    // Regular user cannot write
    await testing.assertFails(
      userDb.collection('products').doc('test-product').set(productData)
    );

    // Unauthenticated cannot write
    await testing.assertFails(
      unauthDb.collection('products').doc('test-product').set(productData)
    );
  });
});

describe('Certifications Collection Security Rules', () => {
  test('Anyone can read certifications', async () => {
    const db = getFirestore(null);
    const testDoc = db.collection('certifications').doc('test-cert');
    await testing.assertSucceeds(testDoc.get());
  });

  test('Only admin users can write to certifications', async () => {
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    const userDb = getFirestore({ uid: 'regular-user' });

    const certData = { name: 'Organic', verified: true };

    await testing.assertSucceeds(
      adminDb.collection('certifications').doc('test-cert').set(certData)
    );

    await testing.assertFails(
      userDb.collection('certifications').doc('test-cert').set(certData)
    );
  });
});

describe('Users Collection Security Rules', () => {
  test('Users can only read their own profile', async () => {
    const userId = 'user123';
    const db = getFirestore({ uid: userId });
    const otherDb = getFirestore({ uid: 'other-user' });

    // Can read own profile
    await testing.assertSucceeds(db.collection('users').doc(userId).get());

    // Cannot read other profiles
    await testing.assertFails(otherDb.collection('users').doc(userId).get());
  });

  test('Users can only write to their own profile', async () => {
    const userId = 'user123';
    const db = getFirestore({ uid: userId });
    const otherDb = getFirestore({ uid: 'other-user' });

    const userData = { name: 'Test User', email: 'test@example.com' };

    // Can write own profile
    await testing.assertSucceeds(
      db.collection('users').doc(userId).set(userData)
    );

    // Cannot write to other profiles
    await testing.assertFails(
      otherDb.collection('users').doc(userId).set(userData)
    );
  });
});

describe('Carts Collection Security Rules', () => {
  test('Users can only access their own cart', async () => {
    const userId = 'user123';
    const db = getFirestore({ uid: userId });
    const otherDb = getFirestore({ uid: 'other-user' });

    const cartData = { items: [], total: 0 };

    // Can read/write own cart
    await testing.assertSucceeds(
      db.collection('carts').doc(userId).set(cartData)
    );
    await testing.assertSucceeds(db.collection('carts').doc(userId).get());

    // Cannot access other carts
    await testing.assertFails(otherDb.collection('carts').doc(userId).get());
    await testing.assertFails(
      otherDb.collection('carts').doc(userId).set(cartData)
    );
  });
});

describe('Orders Collection Security Rules', () => {
  beforeEach(async () => {
    // Set up test order
    const admin = getAdminFirestore();
    await admin.collection('orders').doc('order123').set({
      userId: 'user123',
      items: [],
      total: 50,
    });
  });

  test('Users can read their own orders', async () => {
    const db = getFirestore({ uid: 'user123' });
    const otherDb = getFirestore({ uid: 'other-user' });

    await testing.assertSucceeds(db.collection('orders').doc('order123').get());

    await testing.assertFails(
      otherDb.collection('orders').doc('order123').get()
    );
  });

  test('Users can create their own orders', async () => {
    const db = getFirestore({ uid: 'user123' });
    const orderData = {
      userId: 'user123',
      items: ['item1'],
      total: 30,
    };

    await testing.assertSucceeds(
      db.collection('orders').doc('new-order').set(orderData)
    );

    // Cannot create order for someone else
    const fraudOrder = { ...orderData, userId: 'other-user' };
    await testing.assertFails(
      db.collection('orders').doc('fraud-order').set(fraudOrder)
    );
  });

  test('Users can update their own orders, admins can update any', async () => {
    const userDb = getFirestore({ uid: 'user123' });
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    const otherDb = getFirestore({ uid: 'other-user' });

    const updateData = { status: 'processing' };

    // User can update own order
    await testing.assertSucceeds(
      userDb.collection('orders').doc('order123').update(updateData)
    );

    // Admin can update any order
    await testing.assertSucceeds(
      adminDb.collection('orders').doc('order123').update(updateData)
    );

    // Other users cannot update
    await testing.assertFails(
      otherDb.collection('orders').doc('order123').update(updateData)
    );
  });
});
