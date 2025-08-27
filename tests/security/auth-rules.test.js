// Firestore Security Rules Tests for Authentication
const testing = require('@firebase/testing');
const fs = require('fs');

const projectId = 'vita-tea-test';
const rules = fs.readFileSync('../../firestore.rules', 'utf8');

describe('Authentication Security Rules', () => {
  beforeAll(async () => {
    await testing.loadFirestoreRules({ projectId, rules });
  });

  afterAll(async () => {
    await Promise.all(testing.apps().map(app => app.delete()));
  });

  beforeEach(async () => {
    await testing.clearFirestoreData({ projectId });
  });

  const getFirestore = (auth) => {
    return testing.initializeTestApp({ projectId, auth }).firestore();
  };

  const getAdminFirestore = () => {
    return testing.initializeAdminApp({ projectId }).firestore();
  };

  describe('User Profile Access', () => {
    test('should allow user to read their own profile', async () => {
      const uid = 'user123';
      const db = getFirestore({ uid });
      const profile = db.collection('users').doc(uid);
      
      await testing.assertSucceeds(profile.get());
    });

    test('should allow user to create their own profile with valid data', async () => {
      const uid = 'user123';
      const db = getFirestore({ uid });
      const profile = db.collection('users').doc(uid);
      
      const validUserData = {
        uid: uid,
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          marketingEmails: true,
          orderNotifications: true
        }
      };
      
      await testing.assertSucceeds(profile.set(validUserData));
    });

    test('should prevent user from creating profile with admin role', async () => {
      const uid = 'user123';
      const db = getFirestore({ uid });
      const profile = db.collection('users').doc(uid);
      
      const invalidUserData = {
        uid: uid,
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'admin', // Trying to set admin role
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await testing.assertFails(profile.set(invalidUserData));
    });

    test('should prevent user from reading another user profile', async () => {
      const db = getFirestore({ uid: 'user123' });
      const otherProfile = db.collection('users').doc('other-user');
      
      await testing.assertFails(otherProfile.get());
    });

    test('should prevent user from modifying another user profile', async () => {
      const db = getFirestore({ uid: 'user123' });
      const otherProfile = db.collection('users').doc('other-user');
      
      await testing.assertFails(
        otherProfile.update({ displayName: 'Hacked!' })
      );
    });

    test('should prevent unauthenticated access to user profiles', async () => {
      const db = getFirestore(null);
      const profile = db.collection('users').doc('any-user');
      
      await testing.assertFails(profile.get());
    });

    test('should enforce email validation', async () => {
      const uid = 'user123';
      const db = getFirestore({ uid });
      const profile = db.collection('users').doc(uid);
      
      const invalidEmailData = {
        uid: uid,
        email: 'not-an-email', // Invalid email format
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await testing.assertFails(profile.set(invalidEmailData));
    });

    test('should prevent user from changing their role', async () => {
      const uid = 'user123';
      const adminDb = getAdminFirestore();
      
      // First, create a user profile as admin
      await adminDb.collection('users').doc(uid).set({
        uid: uid,
        email: 'test@example.com',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Now try to update role as the user
      const db = getFirestore({ uid });
      const profile = db.collection('users').doc(uid);
      
      await testing.assertFails(
        profile.update({ role: 'admin' })
      );
    });

    test('should enforce rate limiting on updates', async () => {
      const uid = 'user123';
      const db = getFirestore({ uid });
      const profile = db.collection('users').doc(uid);
      
      // Create initial profile
      const userData = {
        uid: uid,
        email: 'test@example.com',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await profile.set(userData);
      
      // Try immediate update (should fail due to rate limit)
      await testing.assertFails(
        profile.update({ displayName: 'Updated Name' })
      );
    });

    test('should allow admin to read any user profile', async () => {
      const db = getFirestore({ uid: 'admin123', admin: true });
      const userProfile = db.collection('users').doc('any-user');
      
      await testing.assertSucceeds(userProfile.get());
    });
  });

  describe('Cart Access', () => {
    test('should allow user to access their own cart', async () => {
      const uid = 'user123';
      const db = getFirestore({ uid });
      const cart = db.collection('carts').doc(uid);
      
      await testing.assertSucceeds(cart.get());
      await testing.assertSucceeds(
        cart.set({ items: [], updatedAt: new Date() })
      );
    });

    test('should prevent user from accessing other carts', async () => {
      const db = getFirestore({ uid: 'user123' });
      const otherCart = db.collection('carts').doc('other-user');
      
      await testing.assertFails(otherCart.get());
    });

    test('should prevent unauthenticated cart access', async () => {
      const db = getFirestore(null);
      const cart = db.collection('carts').doc('any-user');
      
      await testing.assertFails(cart.get());
    });
  });

  describe('Order Access', () => {
    test('should allow user to create their own order', async () => {
      const uid = 'user123';
      const db = getFirestore({ uid });
      const orders = db.collection('orders');
      
      const orderData = {
        userId: uid,
        items: [{ productId: 'tea1', quantity: 2 }],
        total: 29.99,
        status: 'pending',
        createdAt: new Date()
      };
      
      await testing.assertSucceeds(orders.add(orderData));
    });

    test('should prevent creating order for another user', async () => {
      const db = getFirestore({ uid: 'user123' });
      const orders = db.collection('orders');
      
      const orderData = {
        userId: 'other-user', // Trying to create order for someone else
        items: [],
        total: 0,
        status: 'pending',
        createdAt: new Date()
      };
      
      await testing.assertFails(orders.add(orderData));
    });

    test('should allow user to read their own orders', async () => {
      const uid = 'user123';
      const adminDb = getAdminFirestore();
      
      // Create an order as admin
      const orderRef = await adminDb.collection('orders').add({
        userId: uid,
        items: [],
        total: 0,
        status: 'completed',
        createdAt: new Date()
      });

      // Try to read as user
      const db = getFirestore({ uid });
      await testing.assertSucceeds(
        db.collection('orders').doc(orderRef.id).get()
      );
    });

    test('should prevent reading other user orders', async () => {
      const adminDb = getAdminFirestore();
      
      // Create an order for another user
      const orderRef = await adminDb.collection('orders').add({
        userId: 'other-user',
        items: [],
        total: 0,
        status: 'completed',
        createdAt: new Date()
      });

      // Try to read as different user
      const db = getFirestore({ uid: 'user123' });
      await testing.assertFails(
        db.collection('orders').doc(orderRef.id).get()
      );
    });

    test('should allow user to cancel their own order', async () => {
      const uid = 'user123';
      const adminDb = getAdminFirestore();
      
      // Create an order
      const orderRef = await adminDb.collection('orders').add({
        userId: uid,
        items: [],
        total: 0,
        status: 'pending',
        createdAt: new Date()
      });

      // Cancel as user
      const db = getFirestore({ uid });
      await testing.assertSucceeds(
        db.collection('orders').doc(orderRef.id).update({ status: 'cancelled' })
      );
    });

    test('should prevent user from changing order to non-cancelled status', async () => {
      const uid = 'user123';
      const adminDb = getAdminFirestore();
      
      // Create an order
      const orderRef = await adminDb.collection('orders').add({
        userId: uid,
        items: [],
        total: 0,
        status: 'pending',
        createdAt: new Date()
      });

      // Try to mark as completed (should fail)
      const db = getFirestore({ uid });
      await testing.assertFails(
        db.collection('orders').doc(orderRef.id).update({ status: 'completed' })
      );
    });
  });
});