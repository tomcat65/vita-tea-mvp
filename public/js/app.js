// Main application entry point
import { firebaseReady, db, auth, storage } from './firebase-config.js';
import { authUI } from './auth.js';
import { authGuard } from './auth-guard.js';
import { authService } from './services/auth.service.js';

// Initialize Alpine.js store
document.addEventListener('alpine:init', () => {
  Alpine.store('user', {
    isAuthenticated: false,
    uid: null,
    email: null,
    displayName: null,
    role: 'customer',
    
    login(user) {
      this.isAuthenticated = true;
      this.uid = user.uid;
      this.email = user.email;
      this.displayName = user.displayName || user.email.split('@')[0];
      this.role = user.email === 'admin@vita-tea.com' ? 'admin' : 'customer';
    },
    
    logout() {
      this.isAuthenticated = false;
      this.uid = null;
      this.email = null;
      this.displayName = null;
      this.role = 'customer';
    }
  });
  
  Alpine.store('cart', {
    items: [],
    
    addItem(product, quantity = 1) {
      const existingItem = this.items.find(item => item.productId === product.id);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        this.items.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          image: product.images?.[0] || ''
        });
      }
      this.saveCart();
    },
    
    removeItem(productId) {
      this.items = this.items.filter(item => item.productId !== productId);
      this.saveCart();
    },
    
    updateQuantity(productId, quantity) {
      const item = this.items.find(item => item.productId === productId);
      if (item) {
        item.quantity = Math.max(1, quantity);
        this.saveCart();
      }
    },
    
    getTotal() {
      return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    
    getItemCount() {
      return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    
    clearCart() {
      this.items = [];
      this.saveCart();
    },
    
    loadCart() {
      const savedCart = localStorage.getItem('vita-tea-cart');
      if (savedCart) {
        this.items = JSON.parse(savedCart);
      }
    },
    
    saveCart() {
      localStorage.setItem('vita-tea-cart', JSON.stringify(this.items));
    }
  });
});

/**
 * Initialize the Vita Tea application
 */
async function initApp() {
  try {
    console.log('🍃 Vita Tea App Initializing...');
    
    // Wait for Firebase to be ready
    await firebaseReady;
    
    // Check Firebase connection
    console.log('✅ Firebase connected');
    console.log('📊 Firestore:', db.app.name);
    console.log('🔐 Auth:', auth.app.name);
    console.log('💾 Storage:', storage.app.name);
    
    // Initialize authentication
    await authUI.initialize();
    console.log('🔒 Authentication initialized');
    
    // Initialize auth guard for protected routes
    await authGuard.initialize();
    console.log('🛡️ Route protection initialized');
    
    // Set up auth state listener for Alpine store
    authService.onUserChange((user) => {
      if (window.Alpine && window.Alpine.store('user')) {
        if (user) {
          window.Alpine.store('user').login(user);
        } else {
          window.Alpine.store('user').logout();
        }
      }
    });
    
    // Load cart from localStorage
    if (window.Alpine && window.Alpine.store('cart')) {
      window.Alpine.store('cart').loadCart();
    }
    
    // Load existing collections data for reference
    await loadExistingData();
    
    console.log('🚀 Vita Tea App Ready!');
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
}

/**
 * Load existing collections data (products, certifications) from qtradeteas
 */
async function loadExistingData() {
  try {
    // These collections were imported from qtradeteas page
    console.log('📦 Existing collections available: products, certifications');
    console.log('⚙️ Settings collection (not needed for vita-tea)');
    
    // TODO: Implement product and certification data loading
    // This will be handled in future stories when we build the product catalog
    
  } catch (error) {
    console.error('Error loading existing data:', error);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export for use in other pages
export { initApp as initializeApp };