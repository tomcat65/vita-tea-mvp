/**
 * Firebase service for data operations
 * Handles all Firebase interactions including caching and offline support
 */

import { firebaseReady, db, auth } from '../firebase-config.js';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

class FirebaseService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.listeners = new Map();
        this.db = null;
        this.ready = false;
    }

    /**
     * Initialize the service
     * @returns {Promise<void>}
     */
    async init() {
        await firebaseReady;
        this.db = db;
        this.ready = true;
    }

    /**
     * Get products with optional category filter
     * @param {string|null} category - Optional category to filter by
     * @returns {Promise<Array>} Array of product objects
     */
    async getProducts(category = null) {
        if (!this.ready) {await this.init();}

        const cacheKey = `products_${category || 'all'}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {return cached;}

        try {
            let q = query(
                collection(this.db, 'products'),
                where('isActive', '==', true),
                orderBy('createdAt', 'desc')
            );

            if (category) {
                q = query(
                    collection(this.db, 'products'),
                    where('isActive', '==', true),
                    where('category', '==', category),
                    orderBy('createdAt', 'desc')
                );
            }

            const snapshot = await getDocs(q);
            const products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.setCache(cacheKey, products);
            return products;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }

    /**
     * Get a single product by ID
     * @param {string} productId - The product ID
     * @returns {Promise<Object|null>} Product object or null if not found
     */
    async getProductById(productId) {
        if (!this.ready) {await this.init();}

        const cacheKey = `product_${productId}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {return cached;}

        try {
            const docRef = doc(this.db, 'products', productId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const product = {
                    id: docSnap.id,
                    ...docSnap.data()
                };
                
                // Only return if product is active
                if (product.isActive) {
                    this.setCache(cacheKey, product);
                    return product;
                }
            }

            return null;
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    }

    /**
     * Subscribe to real-time product updates
     * @param {Function} callback - Function to call with updated products
     * @param {string|null} category - Optional category filter
     * @returns {Function} Unsubscribe function
     */
    subscribeToProducts(callback, category = null) {
        if (!this.ready) {
            this.init().then(() => this.subscribeToProducts(callback, category));
            return () => {};
        }

        const listenerKey = `products_${category || 'all'}`;
        
        // Unsubscribe from existing listener if any
        if (this.listeners.has(listenerKey)) {
            this.listeners.get(listenerKey)();
        }

        let q = query(
            collection(this.db, 'products'),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );

        if (category) {
            q = query(
                collection(this.db, 'products'),
                where('isActive', '==', true),
                where('category', '==', category),
                orderBy('createdAt', 'desc')
            );
        }

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const products = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Update cache
                const cacheKey = `products_${category || 'all'}`;
                this.setCache(cacheKey, products);
                
                // Call callback
                callback(products);
            },
            (error) => {
                console.error('Error in products subscription:', error);
                callback([], error);
            }
        );

        this.listeners.set(listenerKey, unsubscribe);
        return unsubscribe;
    }

    /**
     * Subscribe to real-time inventory updates for a specific product
     * @param {string} productId - Product ID to watch
     * @param {Function} callback - Function to call with updated inventory
     * @returns {Function} Unsubscribe function
     */
    subscribeToInventory(productId, callback) {
        if (!this.ready) {
            this.init().then(() => this.subscribeToInventory(productId, callback));
            return () => {};
        }

        const docRef = doc(this.db, 'products', productId);
        
        const unsubscribe = onSnapshot(docRef,
            (doc) => {
                if (doc.exists()) {
                    const inventory = doc.data().inventory || 0;
                    callback(inventory);
                }
            },
            (error) => {
                console.error('Error in inventory subscription:', error);
                callback(0, error);
            }
        );

        return unsubscribe;
    }

    /**
     * Get from cache if valid
     * @param {string} key - Cache key
     * @returns {*} Cached value or null
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    /**
     * Set cache value
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Clear cache
     * @param {string} key - Optional specific key to clear
     */
    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Unsubscribe from all listeners
     */
    unsubscribeAll() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners.clear();
    }
}

// Export singleton instance
export const firebaseService = new FirebaseService();

// Export auth for other services to use
export { auth };