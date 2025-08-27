# API Specification

With our vanilla JavaScript approach, the API surface is minimal. Most operations happen directly through the Firebase Client SDK with security rules enforcement.

## Cloud Functions API

Only critical server-side operations are exposed as Cloud Functions:

```typescript
// functions/src/index.ts

import * as functions from 'firebase-functions';
import { createPaymentIntent, handleStripeWebhook } from './stripe';
import { exportOrders, adjustInventory } from './admin';

// Stripe payment processing
export const stripeCreateIntent = functions.https.onCall(createPaymentIntent);
export const stripeWebhook = functions.https.onRequest(handleStripeWebhook);

// Admin operations (requires admin role)
export const adminExportOrders = functions.https.onCall(exportOrders);
export const adminAdjustInventory = functions.https.onCall(adjustInventory);

// Triggered functions (not callable)
export const onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    // Send order confirmation email via Extension
    // Update inventory counts
  });

export const onOrderStatusChanged = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    // Send status update emails
    // Log state transitions
  });
```

## Client-Side Firebase Operations

All other operations use the Firebase SDK directly from the browser:

```javascript
// public/js/firebase-operations.js

// Product operations (read-only for customers)
async function getProducts() {
  const snapshot = await firebase
    .firestore()
    .collection('products')
    .where('isActive', '==', true)
    .orderBy('category')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Real-time cart subscription
function subscribeToCart(userId, callback) {
  return firebase
    .firestore()
    .collection('carts')
    .doc(userId)
    .onSnapshot(doc => {
      callback(doc.exists ? doc.data() : { items: [] });
    });
}

// Cart operations (user can only modify their own)
async function addToCart(userId, productId, quantity) {
  const cartRef = firebase.firestore().collection('carts').doc(userId);
  return cartRef.set(
    {
      items: firebase.firestore.FieldValue.arrayUnion({
        productId,
        quantity,
        addedAt: firebase.firestore.Timestamp.now(),
      }),
      updatedAt: firebase.firestore.Timestamp.now(),
    },
    { merge: true }
  );
}

// Order history (user can only read their own)
async function getMyOrders(userId) {
  const snapshot = await firebase
    .firestore()
    .collection('orders')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Analytics tracking
async function trackEvent(eventType, eventData) {
  return firebase
    .firestore()
    .collection('analytics')
    .add({
      eventType,
      eventData,
      sessionId: getSessionId(),
      userId: firebase.auth().currentUser?.uid,
      timestamp: firebase.firestore.Timestamp.now(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenSize: `${screen.width}x${screen.height}`,
      },
    });
}
```

## Firestore Security Rules

Security is enforced at the database level:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Products - anyone can read, only admin can write
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Carts - users can only access their own
    match /carts/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Orders - users read own, admin reads all
    match /orders/{orderId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if false; // Only Cloud Functions can create
      allow update: if isAdmin(); // Admin can update status
    }

    // Analytics - write only (no reads)
    match /analytics/{eventId} {
      allow write: if true;
      allow read: if false;
    }

    // Users - read own profile, admin reads all
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow update: if isOwner(userId) &&
        request.resource.data.role == resource.data.role; // Can't change own role
    }
  }
}
```

## Stripe Integration

Stripe.js is loaded directly in the browser for PCI compliance:

```javascript
// public/js/checkout.js
const stripe = Stripe('pk_live_...');

async function processPayment(cartData) {
  // 1. Call Cloud Function to create payment intent
  const { data } = await firebase
    .functions()
    .httpsCallable('stripeCreateIntent')({
    cartId: firebase.auth().currentUser.uid,
  });

  // 2. Use Stripe.js to handle payment
  const { error } = await stripe.confirmCardPayment(data.clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: { name, email },
    },
  });

  if (!error) {
    // Payment successful, order created by webhook
    window.location.href = `/order-confirmation.html?order=${data.orderId}`;
  }
}
```
