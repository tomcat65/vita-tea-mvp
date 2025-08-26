# Data Models

Based on the PRD requirements and e-commerce needs, here are the core data models:

## User

**Purpose:** Represents authenticated users including customers and admins

**Key Attributes:**
- uid: string - Firebase Auth UID
- email: string - User email address
- displayName: string - User's display name
- role: 'customer' | 'admin' - User role
- createdAt: timestamp - Account creation date
- updatedAt: timestamp - Last update timestamp
- lastLoginAt: timestamp - Last login timestamp
- preferences: UserPreferences - User settings

**TypeScript Interface:**
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'customer' | 'admin';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  preferences: UserPreferences;
}

interface UserPreferences {
  marketingEmails: boolean;
  orderNotifications: boolean;
}
```

**Relationships:**
- Has many Orders
- Has many Addresses
- Has one Cart

## Product

**Purpose:** Represents tea products available for purchase

**Key Attributes:**
- productId: string - Unique product identifier
- name: string - Product name
- slug: string - URL-friendly identifier
- description: string - Product description
- category: 'digestive' | 'stress-relief' | 'immunity' - Product category
- price: number - Price in cents
- images: string[] - Array of image URLs
- inventory: number - Available stock
- isActive: boolean - Product availability
- metadata: ProductMetadata - Additional product info

**TypeScript Interface:**
```typescript
interface Product {
  productId: string;
  name: string;
  slug: string;
  description: string;
  category: 'digestive' | 'stress-relief' | 'immunity';
  price: number; // in cents
  images: string[];
  inventory: number;
  isActive: boolean;
  metadata: ProductMetadata;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ProductMetadata {
  ingredients: string[];
  brewingInstructions: string;
  healthBenefits: string[];
  caffeineLevel: 'none' | 'low' | 'medium' | 'high';
}
```

**Relationships:**
- Belongs to many Orders (via OrderItems)
- Has many InventoryLogs

## Order

**Purpose:** Represents customer orders

**Key Attributes:**
- orderId: string - Order ID
- orderNumber: string - Human-readable order number
- userId: string - Customer UID
- status: OrderStatus - Order status
- items: OrderItem[] - Order line items
- subtotal: number - Subtotal in cents
- tax: number - Tax amount in cents
- shipping: number - Shipping cost in cents
- total: number - Total amount in cents
- shippingAddress: Address - Delivery address
- stripePaymentIntentId: string - Stripe payment reference
- estimatedDeliveryAt: timestamp - Expected delivery date

**TypeScript Interface:**
```typescript
interface Order {
  orderId: string;
  orderNumber: string; // e.g., "VT-2024-0001"
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: Address;
  billingAddress: Address;
  stripePaymentIntentId: string;
  estimatedDeliveryAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type OrderStatus = 
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}
```

**Relationships:**
- Belongs to User
- Has many OrderItems
- Has many OrderEvents (status changes)

## Cart

**Purpose:** Represents user's shopping cart

**Key Attributes:**
- cartId: string - Cart ID
- userId: string - User's UID
- items: CartItem[] - Cart items
- expiresAt: timestamp - Cart expiration

**TypeScript Interface:**
```typescript
interface Cart {
  cartId: string;
  userId: string;
  items: CartItem[];
  expiresAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface CartItem {
  productId: string;
  quantity: number;
  addedAt: Timestamp;
}
```

**Relationships:**
- Belongs to User
- References Products

## Address

**Purpose:** Stores shipping/billing addresses

**Key Attributes:**
- addressId: string - Address ID
- userId: string - User's UID
- type: 'shipping' | 'billing' - Address type
- isDefault: boolean - Default address flag
- line1: string - Street address
- city: string - City
- state: string - State/Province
- postalCode: string - ZIP/Postal code
- country: string - Country code

**TypeScript Interface:**
```typescript
interface Address {
  addressId: string;
  userId: string;
  type: 'shipping' | 'billing';
  isDefault: boolean;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Relationships:**
- Belongs to User
- Used by Orders

## InventoryLog

**Purpose:** Tracks all inventory changes for audit and fulfillment

**Key Attributes:**
- logId: string - Log entry ID
- productId: string - Product reference
- previousQuantity: number - Quantity before change
- newQuantity: number - Quantity after change
- changeType: 'order' | 'restock' | 'adjustment' - Type of change
- referenceId: string - Related entity ID (orderId, etc.)

**TypeScript Interface:**
```typescript
interface InventoryLog {
  logId: string;
  productId: string;
  previousQuantity: number;
  newQuantity: number;
  changeType: 'order' | 'restock' | 'adjustment';
  referenceId?: string;
  notes?: string;
  createdAt: Timestamp;
  createdBy: string;
}
```

**Relationships:**
- Belongs to Product
- References Orders (when applicable)

## OrderEvent

**Purpose:** Tracks order status changes for customer service and fulfillment

**Key Attributes:**
- eventId: string - Event ID
- orderId: string - Order reference
- previousStatus: OrderStatus - Status before change
- newStatus: OrderStatus - Status after change
- metadata: object - Additional event data

**TypeScript Interface:**
```typescript
interface OrderEvent {
  eventId: string;
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  metadata?: {
    trackingNumber?: string;
    carrier?: string;
    notes?: string;
  };
  createdAt: Timestamp;
  createdBy: string; // system or userId
}
```

**Relationships:**
- Belongs to Order

## AnalyticsEvent

**Purpose:** Tracks user behavior for conversion optimization and achieving order goals

**Key Attributes:**
- eventId: string - Event ID
- sessionId: string - Browser session ID
- userId: string - User ID (if authenticated)
- eventType: string - Type of event
- eventData: object - Event-specific data

**TypeScript Interface:**
```typescript
interface AnalyticsEvent {
  eventId: string;
  sessionId: string;
  userId?: string;
  eventType: 'page_view' | 'product_view' | 'add_to_cart' | 
             'remove_from_cart' | 'checkout_start' | 'checkout_complete' |
             'search' | 'filter_apply';
  eventData: {
    productId?: string;
    searchQuery?: string;
    filterType?: string;
    revenue?: number;
    [key: string]: any;
  };
  deviceInfo: {
    userAgent: string;
    screenSize: string;
    referrer?: string;
  };
  createdAt: Timestamp;
}
```

**Relationships:**
- Optionally belongs to User
- References Products (in eventData)
