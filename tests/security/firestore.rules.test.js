/**
 * Security rules test suite for Firestore
 * Tests authentication and authorization rules for all collections
 */

const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

// Test project ID
const PROJECT_ID = 'test-vita-tea';

let testEnv;

// Initialize test environment
beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(
        path.resolve(__dirname, '../../firestore.rules'),
        'utf8'
      ),
      host: 'localhost',
      port: 8080
    }
  });
});

// Helper to create test context
function getFirestore(auth) {
  if (!auth) {
    return testEnv.unauthenticatedContext().firestore();
  }
  return testEnv.authenticatedContext(auth.uid, auth).firestore();
}

// Helper to create admin context
function getAdminFirestore() {
  return testEnv.withSecurityRulesDisabled().firestore();
}

// Clean up test environment
beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Products Collection Security Rules', () => {
  beforeEach(async () => {
    // Set up active product for testing
    const admin = getAdminFirestore();
    await admin.collection('products').doc('active-product').set({
      name: 'Green Tea',
      price: 1500,
      category: 'digestive',
      isActive: true,
      inventory: 100,
      updatedAt: new Date()
    });
    await admin.collection('products').doc('inactive-product').set({
      name: 'Old Tea',
      price: 1000,
      category: 'digestive',
      isActive: false,
      inventory: 0,
      updatedAt: new Date()
    });
  });

  test('Anyone can read active products', async () => {
    const db = getFirestore(null); // Unauthenticated
    await assertSucceeds(
      db.collection('products').doc('active-product').get()
    );
  });

  test('Only admin can read inactive products', async () => {
    const db = getFirestore(null); // Unauthenticated
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    
    await assertFails(
      db.collection('products').doc('inactive-product').get()
    );
    
    await assertSucceeds(
      adminDb.collection('products').doc('inactive-product').get()
    );
  });

  test('Product data validation on create', async () => {
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    
    // Valid product
    const validProduct = {
      name: 'New Tea',
      price: 2000, // Must be integer
      category: 'immunity',
      isActive: true,
      inventory: 50
    };
    await assertSucceeds(
      adminDb.collection('products').doc('new-product').set(validProduct)
    );

    // Invalid price (not integer)
    const invalidPrice = { ...validProduct, price: 20.50 };
    await assertFails(
      adminDb.collection('products').doc('bad-price').set(invalidPrice)
    );

    // Invalid category
    const invalidCategory = { ...validProduct, category: 'invalid' };
    await assertFails(
      adminDb.collection('products').doc('bad-category').set(invalidCategory)
    );

    // Missing required fields
    const missingFields = { name: 'Incomplete Tea' };
    await assertFails(
      adminDb.collection('products').doc('incomplete').set(missingFields)
    );
  });

  test('Rate limiting on product updates', async () => {
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    const productRef = adminDb.collection('products').doc('active-product');
    
    // First update should succeed
    await assertSucceeds(
      productRef.update({ price: 1600, updatedAt: new Date() })
    );
    
    // Immediate second update should fail (within 1 second)
    await assertFails(
      productRef.update({ price: 1700, updatedAt: new Date() })
    );
  });
});

describe('Certifications Collection Security Rules', () => {
  test('Anyone can read certifications', async () => {
    const db = getFirestore(null);
    const testDoc = db.collection('certifications').doc('test-cert');
    await assertSucceeds(testDoc.get());
  });

  test('Only admin users can write to certifications', async () => {
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    const userDb = getFirestore({ uid: 'regular-user' });

    const certData = { name: 'Organic', verified: true };

    await assertSucceeds(
      adminDb.collection('certifications').doc('test-cert').set(certData)
    );

    await assertFails(
      userDb.collection('certifications').doc('test-cert').set(certData)
    );
  });
});

describe('Users Collection Security Rules', () => {
  test('Users can only read their own profile', async () => {
    const userId = 'user123';
    const db = getFirestore({ uid: userId });
    const otherDb = getFirestore({ uid: 'other-user' });
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });

    // Can read own profile
    await assertSucceeds(db.collection('users').doc(userId).get());

    // Cannot read other profiles
    await assertFails(otherDb.collection('users').doc(userId).get());
    
    // Admin can read any profile
    await assertSucceeds(adminDb.collection('users').doc(userId).get());
  });

  test('User data validation', async () => {
    const userId = 'user123';
    const db = getFirestore({ uid: userId });
    const now = new Date();

    // Valid user data
    const validUserData = {
      uid: userId,
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'customer',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      preferences: {
        marketingEmails: true,
        orderNotifications: true
      }
    };
    
    await assertSucceeds(
      db.collection('users').doc(userId).set(validUserData)
    );

    // Invalid email format
    const invalidEmail = { ...validUserData, email: 'invalid-email' };
    await assertFails(
      db.collection('users').doc(userId).set(invalidEmail)
    );

    // Invalid role
    const invalidRole = { ...validUserData, role: 'superadmin' };
    await assertFails(
      db.collection('users').doc(userId).set(invalidRole)
    );

    // Users cannot set admin role on creation
    const adminRole = { ...validUserData, role: 'admin' };
    await assertFails(
      db.collection('users').doc(userId).set(adminRole)
    );
  });

  test('Users cannot change uid or role on update', async () => {
    const userId = 'user123';
    const admin = getAdminFirestore();
    const db = getFirestore({ uid: userId });
    const now = new Date();
    
    // Setup existing user
    await admin.collection('users').doc(userId).set({
      uid: userId,
      email: 'test@example.com',
      role: 'customer',
      createdAt: now,
      updatedAt: now
    });
    
    // User cannot change their uid
    await assertFails(
      db.collection('users').doc(userId).update({
        uid: 'different-uid',
        updatedAt: new Date()
      })
    );
    
    // User cannot change their role
    await assertFails(
      db.collection('users').doc(userId).update({
        role: 'admin',
        updatedAt: new Date()
      })
    );
  });

  test('Users cannot be deleted', async () => {
    const userId = 'user123';
    const db = getFirestore({ uid: userId });
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    
    await assertFails(
      db.collection('users').doc(userId).delete()
    );
    
    await assertFails(
      adminDb.collection('users').doc(userId).delete()
    );
  });
});

describe('Carts Collection Security Rules', () => {
  test('Users can only access their own cart', async () => {
    const userId = 'user123';
    const db = getFirestore({ uid: userId });
    const otherDb = getFirestore({ uid: 'other-user' });
    const now = new Date();

    const cartData = { 
      items: [
        {
          productId: 'prod1',
          quantity: 2,
          addedAt: now
        }
      ], 
      updatedAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    // Can read/write own cart
    await assertSucceeds(
      db.collection('carts').doc(userId).set(cartData)
    );
    await assertSucceeds(db.collection('carts').doc(userId).get());

    // Cannot access other carts
    await assertFails(otherDb.collection('carts').doc(userId).get());
    await assertFails(
      otherDb.collection('carts').doc(userId).set(cartData)
    );
  });

  test('Cart data validation', async () => {
    const userId = 'user123';
    const db = getFirestore({ uid: userId });
    const now = new Date();

    // Valid cart
    const validCart = {
      items: [],
      updatedAt: now
    };
    await assertSucceeds(
      db.collection('carts').doc(userId).set(validCart)
    );

    // Missing required fields
    const invalidCart = { items: [] }; // Missing updatedAt
    await assertFails(
      db.collection('carts').doc(userId).set(invalidCart)
    );

    // Invalid items type
    const badItemsType = { items: 'not-an-array', updatedAt: now };
    await assertFails(
      db.collection('carts').doc(userId).set(badItemsType)
    );
  });

  test('Rate limiting on cart updates', async () => {
    const userId = 'user123';
    const db = getFirestore({ uid: userId });
    const admin = getAdminFirestore();
    const now = new Date();
    
    // Set up initial cart
    await admin.collection('carts').doc(userId).set({
      items: [],
      updatedAt: now
    });
    
    // First update should succeed
    await assertSucceeds(
      db.collection('carts').doc(userId).update({ 
        items: [{ productId: 'p1', quantity: 1 }],
        updatedAt: new Date()
      })
    );
    
    // Immediate second update should fail
    await assertFails(
      db.collection('carts').doc(userId).update({ 
        items: [{ productId: 'p2', quantity: 1 }],
        updatedAt: new Date()
      })
    );
  });
});

describe('Orders Collection Security Rules', () => {
  beforeEach(async () => {
    // Set up test order
    const admin = getAdminFirestore();
    const now = new Date();
    await admin.collection('orders').doc('order123').set({
      orderId: 'order123',
      orderNumber: 'VT-2024-0001',
      userId: 'user123',
      status: 'pending',
      items: [
        {
          productId: 'prod1',
          name: 'Green Tea',
          price: 1500,
          quantity: 2
        }
      ],
      shippingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        country: 'US',
        phone: '555-1234'
      },
      billingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        country: 'US',
        phone: '555-1234'
      },
      payment: {
        stripePaymentIntentId: 'pi_test123',
        last4: '4242',
        brand: 'visa'
      },
      subtotal: 3000,
      tax: 300,
      shipping: 500,
      total: 3800,
      createdAt: now,
      updatedAt: now
    });
  });

  test('Users can read their own orders, admins can read all', async () => {
    const db = getFirestore({ uid: 'user123' });
    const otherDb = getFirestore({ uid: 'other-user' });
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });

    await assertSucceeds(db.collection('orders').doc('order123').get());
    await assertFails(otherDb.collection('orders').doc('order123').get());
    await assertSucceeds(adminDb.collection('orders').doc('order123').get());
  });

  test('Orders can only be created via Cloud Functions', async () => {
    const db = getFirestore({ uid: 'user123' });
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    const now = new Date();
    
    const orderData = {
      orderId: 'new-order',
      orderNumber: 'VT-2024-0002',
      userId: 'user123',
      status: 'pending',
      items: [{ productId: 'p1', name: 'Tea', price: 1000, quantity: 1 }],
      shippingAddress: {},
      billingAddress: {},
      subtotal: 1000,
      tax: 100,
      shipping: 500,
      total: 1600,
      createdAt: now
    };

    // Even authenticated users cannot create orders directly
    await assertFails(
      db.collection('orders').doc('new-order').set(orderData)
    );
    
    // Even admins cannot create orders directly
    await assertFails(
      adminDb.collection('orders').doc('new-order').set(orderData)
    );
  });

  test('Only admins can update orders with validation', async () => {
    const userDb = getFirestore({ uid: 'user123' });
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    const now = new Date();

    // Valid status update by admin
    await assertSucceeds(
      adminDb.collection('orders').doc('order123').update({
        status: 'processing',
        updatedAt: now
      })
    );

    // User cannot update orders
    await assertFails(
      userDb.collection('orders').doc('order123').update({
        status: 'shipped',
        updatedAt: now
      })
    );

    // Invalid status
    await assertFails(
      adminDb.collection('orders').doc('order123').update({
        status: 'invalid-status',
        updatedAt: now
      })
    );
  });

  test('Orders cannot be deleted', async () => {
    const userDb = getFirestore({ uid: 'user123' });
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    
    await assertFails(
      userDb.collection('orders').doc('order123').delete()
    );
    
    await assertFails(
      adminDb.collection('orders').doc('order123').delete()
    );
  });
});

describe('Addresses Collection Security Rules', () => {
  beforeEach(async () => {
    const admin = getAdminFirestore();
    await admin.collection('addresses').doc('addr123').set({
      userId: 'user123',
      type: 'shipping',
      isDefault: true,
      fullName: 'Test User',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4',
      city: 'Test City',
      state: 'CA',
      zipCode: '12345',
      country: 'US',
      phone: '555-1234'
    });
  });

  test('Users can only access their own addresses', async () => {
    const db = getFirestore({ uid: 'user123' });
    const otherDb = getFirestore({ uid: 'other-user' });
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });

    await assertSucceeds(db.collection('addresses').doc('addr123').get());
    await assertFails(otherDb.collection('addresses').doc('addr123').get());
    await assertSucceeds(adminDb.collection('addresses').doc('addr123').get());
  });

  test('Address data validation', async () => {
    const db = getFirestore({ uid: 'user123' });
    
    // Valid address
    const validAddress = {
      userId: 'user123',
      type: 'billing',
      isDefault: false,
      fullName: 'Test User',
      addressLine1: '456 Oak St',
      city: 'Another City',
      state: 'NY',
      zipCode: '54321',
      country: 'US',
      phone: '555-5678'
    };
    
    await assertSucceeds(
      db.collection('addresses').doc('new-addr').set(validAddress)
    );

    // Invalid type
    const invalidType = { ...validAddress, type: 'invalid' };
    await assertFails(
      db.collection('addresses').doc('bad-type').set(invalidType)
    );

    // Missing required fields
    const missingFields = { userId: 'user123', type: 'shipping' };
    await assertFails(
      db.collection('addresses').doc('incomplete').set(missingFields)
    );
  });

  test('Users cannot change userId on update', async () => {
    const db = getFirestore({ uid: 'user123' });
    
    // First need to wait a second for rate limiting
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    await assertFails(
      db.collection('addresses').doc('addr123').update({
        userId: 'different-user',
        updatedAt: new Date()
      })
    );
  });
});

describe('InventoryLogs Collection Security Rules', () => {
  test('Only admins can read inventory logs', async () => {
    const userDb = getFirestore({ uid: 'user123' });
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    
    await assertFails(
      userDb.collection('inventoryLogs').doc('log1').get()
    );
    
    await assertSucceeds(
      adminDb.collection('inventoryLogs').doc('log1').get()
    );
  });

  test('No one can write inventory logs directly', async () => {
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    const logData = {
      productId: 'prod1',
      changeType: 'order',
      previousQuantity: 100,
      newQuantity: 98,
      changeAmount: -2,
      performedBy: 'admin-user',
      createdAt: new Date()
    };
    
    await assertFails(
      adminDb.collection('inventoryLogs').doc('new-log').set(logData)
    );
  });
});

describe('OrderEvents Collection Security Rules', () => {
  beforeEach(async () => {
    const admin = getAdminFirestore();
    // Create order and event
    await admin.collection('orders').doc('order123').set({
      userId: 'user123',
      status: 'processing'
    });
    
    await admin.collection('orderEvents').doc('event1').set({
      orderId: 'order123',
      eventType: 'status_change',
      previousStatus: 'pending',
      newStatus: 'processing',
      performedBy: 'system',
      createdAt: new Date()
    });
  });

  test('Order owners can read events, others cannot', async () => {
    const ownerDb = getFirestore({ uid: 'user123' });
    const otherDb = getFirestore({ uid: 'other-user' });
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    
    await assertSucceeds(
      ownerDb.collection('orderEvents').doc('event1').get()
    );
    
    await assertFails(
      otherDb.collection('orderEvents').doc('event1').get()
    );
    
    await assertSucceeds(
      adminDb.collection('orderEvents').doc('event1').get()
    );
  });

  test('No one can write order events directly', async () => {
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    const eventData = {
      orderId: 'order123',
      eventType: 'shipment_update',
      trackingNumber: '123456789',
      carrier: 'USPS',
      performedBy: 'admin-user',
      createdAt: new Date()
    };
    
    await assertFails(
      adminDb.collection('orderEvents').doc('new-event').set(eventData)
    );
  });
});

describe('Analytics Collection Security Rules', () => {
  test('Only admins can read analytics', async () => {
    const userDb = getFirestore({ uid: 'user123' });
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    
    await assertFails(
      userDb.collection('analytics').doc('event1').get()
    );
    
    await assertSucceeds(
      adminDb.collection('analytics').doc('event1').get()
    );
  });

  test('No one can write analytics directly', async () => {
    const adminDb = getFirestore({ uid: 'admin-user', admin: true });
    const eventData = {
      eventType: 'page_view',
      sessionId: 'session123',
      eventData: { page: '/products' },
      deviceInfo: {
        userAgent: 'Mozilla/5.0',
        platform: 'Windows',
        isMobile: false
      },
      createdAt: new Date()
    };
    
    await assertFails(
      adminDb.collection('analytics').doc('new-event').set(eventData)
    );
  });
});
