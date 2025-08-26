# Database Schema

Based on our data models and Firestore's NoSQL structure, here's the concrete database schema:

## Firestore Collections Structure

```javascript
// Collection: users
{
  "uid": "firebase_auth_uid", // Document ID matches Firebase Auth UID
  "email": "customer@example.com",
  "displayName": "Jane Doe",
  "role": "customer", // or "admin"
  "createdAt": Timestamp,
  "updatedAt": Timestamp,
  "lastLoginAt": Timestamp,
  "preferences": {
    "marketingEmails": true,
    "orderNotifications": true
  }
}

// Collection: products
{
  "productId": "auto_generated_id",
  "name": "Digestive Harmony Tea",
  "slug": "digestive-harmony-tea",
  "description": "A soothing blend of peppermint and ginger...",
  "category": "digestive", // enum: digestive, stress-relief, immunity
  "price": 2499, // $24.99 in cents
  "images": [
    "https://firebasestorage.googleapis.com/...",
    "https://firebasestorage.googleapis.com/..."
  ],
  "inventory": 150,
  "isActive": true,
  "metadata": {
    "ingredients": ["Peppermint", "Ginger", "Fennel", "Chamomile"],
    "brewingInstructions": "Steep 1 tsp in 8oz hot water for 5-7 minutes",
    "healthBenefits": ["Aids digestion", "Reduces bloating", "Soothes stomach"],
    "caffeineLevel": "none"
  },
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}

// Collection: carts
{
  "cartId": "user_uid", // Document ID matches user's UID
  "userId": "user_uid",
  "items": [
    {
      "productId": "product_123",
      "quantity": 2,
      "addedAt": Timestamp
    }
  ],
  "expiresAt": Timestamp, // 7 days from last update
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}

// Collection: orders
{
  "orderId": "auto_generated_id",
  "orderNumber": "VT-2024-0001", // Human-readable
  "userId": "user_uid",
  "status": "processing", // pending, processing, shipped, delivered, cancelled, refunded
  "items": [
    {
      "productId": "product_123",
      "productName": "Digestive Harmony Tea", // Denormalized
      "price": 2499, // Price at time of order
      "quantity": 2,
      "subtotal": 4998
    }
  ],
  "subtotal": 4998,
  "tax": 400,
  "shipping": 599,
  "total": 5997,
  "shippingAddress": {
    "name": "Jane Doe",
    "line1": "123 Tea Street",
    "line2": "Apt 4B",
    "city": "Portland",
    "state": "OR",
    "postalCode": "97201",
    "country": "US",
    "phone": "+1-555-0123"
  },
  "billingAddress": {}, // Same structure as shipping
  "stripePaymentIntentId": "pi_1234567890",
  "estimatedDeliveryAt": Timestamp,
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}

// Collection: addresses
{
  "addressId": "auto_generated_id",
  "userId": "user_uid",
  "type": "shipping", // or "billing"
  "isDefault": true,
  "name": "Jane Doe",
  "line1": "123 Tea Street",
  "line2": "Apt 4B",
  "city": "Portland",
  "state": "OR",
  "postalCode": "97201",
  "country": "US",
  "phone": "+1-555-0123",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}

// Collection: inventoryLogs
{
  "logId": "auto_generated_id",
  "productId": "product_123",
  "previousQuantity": 150,
  "newQuantity": 148,
  "changeType": "order", // order, restock, adjustment
  "referenceId": "order_456", // Related order ID if applicable
  "notes": "Order fulfillment",
  "createdAt": Timestamp,
  "createdBy": "system" // or admin user ID
}

// Collection: orderEvents
{
  "eventId": "auto_generated_id",
  "orderId": "order_456",
  "previousStatus": "pending",
  "newStatus": "processing",
  "metadata": {
    "trackingNumber": "1Z999AA10123456784",
    "carrier": "UPS",
    "notes": "Shipped via UPS Ground"
  },
  "createdAt": Timestamp,
  "createdBy": "admin_uid" // or "system"
}

// Collection: analytics
{
  "eventId": "auto_generated_id",
  "sessionId": "session_123",
  "userId": "user_uid", // Optional, null for guests
  "eventType": "add_to_cart", // page_view, product_view, etc.
  "eventData": {
    "productId": "product_123",
    "quantity": 1,
    "revenue": 2499 // For conversion events
  },
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "screenSize": "1920x1080",
    "referrer": "https://google.com"
  },
  "createdAt": Timestamp
}

// Collection: emailTemplates (for Trigger Email Extension)
{
  "templateId": "order_confirmation",
  "subject": "Order {{orderNumber}} Confirmed!",
  "html": "<h1>Thanks for your order!</h1>...",
  "text": "Thanks for your order...",
  "active": true
}
```

## Firestore Indexes

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "orders",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "orders",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "products",
      "fields": [
        {"fieldPath": "isActive", "order": "ASCENDING"},
        {"fieldPath": "category", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "analytics",
      "fields": [
        {"fieldPath": "eventType", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

## Data Consistency Strategies

1. **Inventory Management**:
   - Use transactions when updating inventory during checkout
   - Maintain inventory logs for audit trail
   - Real-time listeners update UI immediately

2. **Order Processing**:
   - Orders created only after successful payment
   - Status transitions logged in orderEvents
   - Denormalized product data preserves historical accuracy

3. **Cart Management**:
   - Cart documents expire after 7 days of inactivity
   - Guest carts stored in localStorage, merged on signup
   - Real-time sync between devices for logged-in users
