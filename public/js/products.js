/**
 * Products catalog page controller
 * Handles product loading, filtering, and interaction management
 */

import { firebaseService } from './services/firebase.service.js';
import { analyticsService } from './services/analytics.service.js';

/**
 * Initialize the products catalog functionality
 * @returns {void}
 */
export function initProductsCatalog() {
    // Track page view
    analyticsService.trackPageView('shop', {
        title: 'Shop Our Tea Collections'
    });

    // Alpine.js store for products state management
    Alpine.store('products', {
        items: [],
        loading: false,
        currentCategory: null,
        error: null,

        /**
         * Load products from Firebase
         * @param {string|null} category - Optional category filter
         * @returns {Promise<void>}
         */
        async loadProducts(category = null) {
            this.loading = true;
            this.error = null;
            
            try {
                this.items = await firebaseService.getProducts(category);
                
                // Track successful load
                analyticsService.trackEvent('products_loaded', {
                    count: this.items.length,
                    category: category || 'all'
                });
            } catch (error) {
                console.error('Error loading products:', error);
                this.error = 'Failed to load products. Please try again later.';
                
                // Track error
                analyticsService.trackError('products_load_failed', error);
            } finally {
                this.loading = false;
            }
        },

        /**
         * Filter products by category
         * @param {string|null} category - Category to filter by
         * @returns {void}
         */
        filterByCategory(category) {
            this.currentCategory = category;
            
            // Track filter usage
            analyticsService.trackEvent('category_filter_used', {
                category: category || 'all'
            });
        },

        /**
         * Get filtered products based on current category
         * @returns {Array} Filtered products array
         */
        get filteredProducts() {
            if (!this.currentCategory) {return this.items;}
            return this.items.filter(product => product.category === this.currentCategory);
        }
    });
}

/**
 * Handle add to cart event from product card
 * @param {CustomEvent} event - Custom event with product details
 * @returns {void}
 */
export function handleAddToCart(event) {
    const { productId, productName, price, category } = event.detail;
    
    // Track add to cart action
    analyticsService.trackEvent('add_to_cart', {
        productId,
        productName,
        price,
        category,
        source: 'catalog'
    });

    // Cart functionality to be implemented in future story
    console.log('Add to cart:', productId);
}

/**
 * Handle view product event from product card
 * @param {CustomEvent} event - Custom event with product details
 * @returns {void}
 */
export function handleViewProduct(event) {
    const { productId } = event.detail;
    
    // Track product view intent
    analyticsService.trackEvent('product_view_clicked', {
        productId,
        source: 'catalog'
    });

    // Navigate to product detail page
    window.location.href = `/product.html?id=${productId}`;
}

/**
 * Initialize scroll depth tracking for the catalog page
 * @returns {void}
 */
export function initScrollTracking() {
    let maxScroll = 0;
    let tracked25 = false;
    let tracked50 = false;
    let tracked75 = false;
    let tracked100 = false;

    window.addEventListener('scroll', () => {
        const scrollPercentage = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
        
        if (scrollPercentage > maxScroll) {
            maxScroll = scrollPercentage;
            
            if (!tracked25 && maxScroll >= 25) {
                tracked25 = true;
                analyticsService.trackEvent('catalog_scroll_depth', { depth: 25 });
            } else if (!tracked50 && maxScroll >= 50) {
                tracked50 = true;
                analyticsService.trackEvent('catalog_scroll_depth', { depth: 50 });
            } else if (!tracked75 && maxScroll >= 75) {
                tracked75 = true;
                analyticsService.trackEvent('catalog_scroll_depth', { depth: 75 });
            } else if (!tracked100 && maxScroll >= 90) {
                tracked100 = true;
                analyticsService.trackEvent('catalog_scroll_depth', { depth: 100 });
            }
        }
    });
}