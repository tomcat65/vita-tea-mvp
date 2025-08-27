/**
 * Product detail page controller
 * Handles individual product display, SEO, and interactions
 */

import { firebaseService } from './services/firebase.service.js';
import { analyticsService } from './services/analytics.service.js';
import { generateProductSchema, updateMetaTags } from './utils/seo.js';

/**
 * Initialize the product detail functionality
 * @returns {void}
 */
export function initProductDetail() {
    // Get product ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = '/shop.html';
        return;
    }

    // Alpine.js store for product detail state
    Alpine.store('productDetail', {
        product: null,
        loading: true,
        error: null,
        productId: productId,

        /**
         * Load product data from Firebase
         * @returns {Promise<void>}
         */
        async loadProduct() {
            this.loading = true;
            this.error = null;
            
            try {
                const product = await firebaseService.getProductById(this.productId);
                
                if (!product) {
                    this.error = 'Product not found';
                    analyticsService.trackEvent('product_not_found', {
                        productId: this.productId
                    });
                    return;
                }

                this.product = product;

                // Update page metadata for SEO
                this.updatePageMetadata();

                // Track product view
                analyticsService.trackEvent('product_viewed', {
                    productId: product.id,
                    productName: product.name,
                    category: product.category,
                    price: product.price
                });

                // Track page view
                analyticsService.trackPageView(`product/${product.slug}`, {
                    title: product.name,
                    productId: product.id
                });

                // Initialize scroll depth tracking
                initScrollDepthTracking(product.id);

            } catch (error) {
                console.error('Error loading product:', error);
                this.error = 'Failed to load product. Please try again later.';
                analyticsService.trackError('product_load_failed', error);
            } finally {
                this.loading = false;
            }
        },

        /**
         * Update page metadata for SEO and social sharing
         * @returns {void}
         */
        updatePageMetadata() {
            const product = this.product;
            if (!product) {return;}

            // Update title
            document.title = `${product.name} - Organic Wellness Tea | VitaTea`;
            
            // Update meta tags
            updateMetaTags({
                description: `${product.description} Premium organic ${product.name} tea. ${product.metadata.healthBenefits[0]}`,
                'og:title': product.name,
                'og:description': product.description,
                'og:image': product.images[0],
                'og:url': window.location.href
            });

            // Generate and inject structured data
            const schema = generateProductSchema(product);
            document.getElementById('product-schema').textContent = JSON.stringify(schema);
        },

        /**
         * Handle add to cart action
         * @returns {void}
         */
        addToCart() {
            if (!this.product || this.product.inventory === 0) {return;}

            // Track add to cart event
            analyticsService.trackEvent('add_to_cart', {
                productId: this.product.id,
                productName: this.product.name,
                price: this.product.price,
                category: this.product.category,
                source: 'product_detail'
            });

            // Cart functionality will be implemented in a future story
            console.log('Add to cart:', this.product.id);
            alert('Product added to cart! (Cart functionality coming soon)');
        }
    });
}

/**
 * Initialize scroll depth tracking for product detail page
 * @param {string} productId - The product ID being viewed
 * @returns {void}
 */
function initScrollDepthTracking(productId) {
    let maxScroll = 0;
    let tracked25 = false;
    let tracked50 = false;
    let tracked75 = false;
    let tracked100 = false;

    const trackScroll = () => {
        const scrollPercentage = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
        
        if (scrollPercentage > maxScroll) {
            maxScroll = scrollPercentage;
            
            if (!tracked25 && maxScroll >= 25) {
                tracked25 = true;
                analyticsService.trackEvent('product_detail_scroll', { 
                    productId, 
                    depth: 25 
                });
            } else if (!tracked50 && maxScroll >= 50) {
                tracked50 = true;
                analyticsService.trackEvent('product_detail_scroll', { 
                    productId, 
                    depth: 50 
                });
            } else if (!tracked75 && maxScroll >= 75) {
                tracked75 = true;
                analyticsService.trackEvent('product_detail_scroll', { 
                    productId, 
                    depth: 75 
                });
            } else if (!tracked100 && maxScroll >= 90) {
                tracked100 = true;
                analyticsService.trackEvent('product_detail_scroll', { 
                    productId, 
                    depth: 100 
                });
            }
        }
    };

    // Debounce scroll tracking
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(trackScroll, 100);
    });
}