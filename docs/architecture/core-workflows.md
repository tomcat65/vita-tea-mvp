# Core Workflows

Here are the critical user journeys illustrated with sequence diagrams:

## User Registration and First Purchase Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant FB as Firebase Auth
    participant FS as Firestore
    participant CF as Cloud Functions
    participant S as Stripe
    participant E as Email Extension

    U->>B: Visit site
    B->>B: Load products from Firestore
    U->>B: Click "Sign Up"
    B->>FB: Create account (email/password)
    FB->>FS: Create user document
    FB-->>B: Return user token
    B->>B: Store auth state
    
    U->>B: Add tea to cart
    B->>FS: Create/update cart document
    FS-->>B: Real-time cart update
    
    U->>B: Proceed to checkout
    B->>B: Load Stripe.js
    U->>B: Enter payment details
    B->>CF: Call createPaymentIntent
    CF->>FS: Validate cart
    CF->>S: Create payment intent
    S-->>CF: Return client secret
    CF-->>B: Return to browser
    
    B->>S: Confirm payment (Stripe.js)
    S->>CF: Webhook: payment_intent.succeeded
    CF->>FS: Create order document
    CF->>FS: Update inventory
    CF->>FS: Clear user cart
    CF->>E: Trigger order confirmation email
    
    B->>B: Redirect to confirmation page
    E->>U: Send order email
```

## Admin Order Management Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant B as Browser
    participant FB as Firebase Auth
    participant FS as Firestore
    participant CF as Cloud Functions
    participant E as Email Extension

    A->>B: Login to admin panel
    B->>FB: Authenticate admin
    FB->>FS: Check user role
    FS-->>FB: Confirm admin role
    FB-->>B: Admin access granted
    
    B->>FS: Subscribe to orders collection
    FS-->>B: Real-time order updates
    
    A->>B: Select order to process
    B->>FS: Get order details
    
    A->>B: Update status to "processing"
    B->>FS: Update order document
    FS->>CF: Trigger: onOrderStatusChanged
    CF->>E: Send status update email
    
    A->>B: Print shipping label
    A->>B: Update status to "shipped"
    B->>FS: Update order with tracking
    FS->>CF: Trigger: onOrderStatusChanged
    CF->>E: Send shipping notification
    
    E->>Customer: Shipping confirmation email
```

## Real-time Inventory Management

```mermaid
sequenceDiagram
    participant C1 as Customer 1
    participant C2 as Customer 2
    participant B1 as Browser 1
    participant B2 as Browser 2
    participant FS as Firestore
    participant CF as Cloud Functions

    Note over B1,B2: Both customers viewing same product
    
    B1->>FS: Subscribe to product inventory
    B2->>FS: Subscribe to product inventory
    
    C1->>B1: Add 3 units to cart
    B1->>FS: Update cart
    
    C2->>B2: Add 5 units to cart
    B2->>FS: Update cart
    
    C1->>B1: Complete checkout
    B1->>CF: Create payment intent
    CF->>FS: Check available inventory
    Note over CF: Inventory: 10 units available
    CF->>S: Process payment
    
    S->>CF: Payment successful
    CF->>FS: Reduce inventory by 3
    FS-->>B1: Inventory update: 7 remaining
    FS-->>B2: Inventory update: 7 remaining
    
    Note over B2: Updates shown in real-time
    C2->>B2: Tries to checkout 5 units
    B2->>CF: Create payment intent
    CF->>FS: Check available inventory
    Note over CF: Only 7 units available
    CF-->>B2: Quantity available: 7
    B2->>C2: Show quantity adjustment needed
```

## Guest Checkout with Account Creation

```mermaid
sequenceDiagram
    participant G as Guest
    participant B as Browser
    participant LS as LocalStorage
    participant CF as Cloud Functions
    participant FB as Firebase Auth
    participant FS as Firestore

    G->>B: Browse products
    G->>B: Add to cart (not logged in)
    B->>LS: Store cart locally
    
    G->>B: Proceed to checkout
    B->>B: Show guest checkout option
    
    G->>B: Enter email & shipping info
    G->>B: Enter payment details
    B->>CF: Create guest payment intent
    CF->>CF: Create temporary checkout session
    
    Note over B: Payment processed successfully
    
    B->>B: Offer account creation
    G->>B: Choose to create account
    B->>FB: Create account with email
    FB->>FS: Create user document
    
    B->>LS: Get local cart data
    B->>FS: Merge cart to user account
    B->>FS: Associate order with new account
    
    FB-->>B: Account created
    B->>G: Show order in account history
```
