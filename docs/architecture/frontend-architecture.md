# Frontend Architecture

## Component Architecture

### Component Organization

```
public/
├── js/
│   ├── app.js                 # Main application entry point
│   ├── firebase-config.js     # Firebase initialization
│   ├── auth.js               # Authentication logic
│   ├── products.js           # Product catalog management
│   ├── cart.js               # Shopping cart logic
│   ├── checkout.js           # Checkout flow
│   ├── admin/                # Admin-specific modules
│   │   ├── dashboard.js
│   │   ├── orders.js
│   │   └── inventory.js
│   ├── components/           # Reusable components
│   │   ├── product-card.js   # Web Component
│   │   ├── cart-item.js      # Web Component
│   │   └── notification.js   # Toast notifications
│   └── utils/               # Utility functions
│       ├── formatters.js    # Price, date formatting
│       ├── validators.js    # Form validation
│       └── analytics.js     # Event tracking
```

### Component Template

```javascript
// public/js/components/product-card.js
class ProductCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const product = JSON.parse(this.getAttribute('data-product'));
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        /* Component-scoped styles */
      </style>
      <div class="product-card">
        <img src="${product.images[0]}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p class="price">$${(product.price / 100).toFixed(2)}</p>
        <button id="add-to-cart">Add to Cart</button>
      </div>
    `;

    this.shadowRoot
      .getElementById('add-to-cart')
      .addEventListener('click', () => this.addToCart(product));
  }

  async addToCart(product) {
    // Dispatch custom event that cart.js listens for
    this.dispatchEvent(
      new CustomEvent('add-to-cart', {
        detail: product,
        bubbles: true,
      })
    );
  }
}

customElements.define('product-card', ProductCard);
```

## State Management Architecture

### State Structure

```javascript
// public/js/state.js - Simple state management with Alpine.js
document.addEventListener('alpine:init', () => {
  Alpine.store('user', {
    isAuthenticated: false,
    uid: null,
    email: null,
    displayName: null,
    role: 'customer',

    async init() {
      firebase.auth().onAuthStateChanged(async user => {
        if (user) {
          const userDoc = await firebase
            .firestore()
            .collection('users')
            .doc(user.uid)
            .get();
          const userData = userDoc.data();

          this.isAuthenticated = true;
          this.uid = user.uid;
          this.email = user.email;
          this.displayName = userData.displayName;
          this.role = userData.role;
        } else {
          this.reset();
        }
      });
    },

    reset() {
      this.isAuthenticated = false;
      this.uid = null;
      this.email = null;
      this.displayName = null;
      this.role = 'customer';
    },
  });

  Alpine.store('cart', {
    items: [],
    total: 0,

    init() {
      // Subscribe to cart changes if authenticated
      Alpine.effect(() => {
        const user = Alpine.store('user');
        if (user.isAuthenticated) {
          this.subscribeToCart(user.uid);
        } else {
          this.loadGuestCart();
        }
      });
    },

    subscribeToCart(userId) {
      return firebase
        .firestore()
        .collection('carts')
        .doc(userId)
        .onSnapshot(doc => {
          if (doc.exists) {
            this.items = doc.data().items || [];
            this.calculateTotal();
          }
        });
    },

    loadGuestCart() {
      const saved = localStorage.getItem('guest-cart');
      this.items = saved ? JSON.parse(saved) : [];
      this.calculateTotal();
    },

    calculateTotal() {
      // Calculate from items
    },
  });
});
```

### State Management Patterns

- Alpine.js stores for reactive global state
- Firebase real-time listeners for server state
- LocalStorage for guest user persistence
- Custom events for component communication

## Routing Architecture

### Route Organization

```
/ (index.html)                  # Homepage with hero and featured products
/shop.html                      # Product catalog with filters
/product.html?id={productId}    # Individual product page
/cart.html                      # Shopping cart
/checkout.html                  # Checkout flow
/order-confirmation.html        # Order success page
/account.html                   # User account dashboard
/admin/                         # Admin section (protected)
  ├── index.html               # Admin dashboard
  ├── orders.html              # Order management
  ├── inventory.html           # Inventory management
  └── analytics.html           # Sales analytics
```

### Protected Route Pattern

```javascript
// public/js/auth-guard.js
class AuthGuard {
  static async checkAccess(requiredRole = 'customer') {
    return new Promise(resolve => {
      firebase.auth().onAuthStateChanged(async user => {
        if (!user) {
          window.location.href =
            '/login.html?redirect=' +
            encodeURIComponent(window.location.pathname);
          return;
        }

        if (requiredRole === 'admin') {
          const userDoc = await firebase
            .firestore()
            .collection('users')
            .doc(user.uid)
            .get();
          const userData = userDoc.data();

          if (userData.role !== 'admin') {
            window.location.href = '/';
            return;
          }
        }

        resolve(user);
      });
    });
  }
}

// Usage in admin pages
document.addEventListener('DOMContentLoaded', async () => {
  await AuthGuard.checkAccess('admin');
  // Initialize admin UI
});
```

## Frontend Services Layer

### API Client Setup

```javascript
// public/js/services/firebase-service.js
class FirebaseService {
  constructor() {
    this.db = firebase.firestore();
    this.auth = firebase.auth();
    this.functions = firebase.functions();
    this.storage = firebase.storage();
  }

  // Products
  async getProducts(category = null) {
    let query = this.db.collection('products').where('isActive', '==', true);

    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // Cart operations
  async addToCart(productId, quantity) {
    const user = this.auth.currentUser;
    if (!user) {
      // Handle guest cart
      CartService.addToGuestCart(productId, quantity);
      return;
    }

    const cartRef = this.db.collection('carts').doc(user.uid);
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

  // Checkout
  async createPaymentIntent(shippingAddress) {
    const createIntent = this.functions.httpsCallable('stripeCreateIntent');
    return createIntent({ shippingAddress });
  }
}

const firebaseService = new FirebaseService();
export default firebaseService;
```

### Service Example

```javascript
// public/js/services/analytics-service.js
class AnalyticsService {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.db = firebase.firestore();
  }

  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  async trackEvent(eventType, eventData = {}) {
    const user = firebase.auth().currentUser;

    const event = {
      eventType,
      eventData,
      sessionId: this.sessionId,
      userId: user?.uid || null,
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenSize: `${screen.width}x${screen.height}`,
        referrer: document.referrer,
      },
      timestamp: firebase.firestore.Timestamp.now(),
    };

    // Send to Firebase Analytics
    if (window.gtag) {
      gtag('event', eventType, eventData);
    }

    // Also store in Firestore for custom analysis
    return this.db.collection('analytics').add(event);
  }

  trackPageView() {
    this.trackEvent('page_view', {
      page: window.location.pathname,
      title: document.title,
    });
  }

  trackAddToCart(product, quantity) {
    this.trackEvent('add_to_cart', {
      productId: product.productId,
      productName: product.name,
      quantity,
      value: (product.price * quantity) / 100,
    });
  }

  trackPurchase(order) {
    this.trackEvent('purchase', {
      orderId: order.orderId,
      value: order.total / 100,
      currency: 'USD',
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price / 100,
      })),
    });
  }
}

const analytics = new AnalyticsService();
export default analytics;
```
