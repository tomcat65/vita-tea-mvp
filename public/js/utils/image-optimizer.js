/**
 * Image optimization utilities
 * Provides functions for optimizing image loading and format selection
 */

/**
 * Create a picture element with WebP and fallback formats
 * @param {string} src - Base image URL (without extension)
 * @param {string} alt - Alt text for the image
 * @param {Object} options - Additional options
 * @returns {string} HTML string for picture element
 */
export function createOptimizedPicture(src, alt, options = {}) {
    const {
        sizes = '100vw',
        loading = 'lazy',
        className = '',
        width = null,
        height = null
    } = options;
    
    // Extract base URL and extension
    const lastDot = src.lastIndexOf('.');
    const baseUrl = lastDot > -1 ? src.substring(0, lastDot) : src;
    const extension = lastDot > -1 ? src.substring(lastDot + 1) : 'jpg';
    
    // For Unsplash URLs, we can use their API for format conversion
    if (src.includes('unsplash.com')) {
        return createUnsplashPicture(src, alt, options);
    }
    
    // For local images, assume WebP versions are available
    const webpSrc = `${baseUrl}.webp`;
    const fallbackSrc = src;
    
    return `
        <picture>
            <source srcset="${webpSrc}" type="image/webp">
            <source srcset="${fallbackSrc}" type="image/${extension}">
            <img 
                src="${fallbackSrc}" 
                alt="${alt}"
                loading="${loading}"
                class="${className}"
                ${width ? `width="${width}"` : ''}
                ${height ? `height="${height}"` : ''}
                ${sizes !== '100vw' ? `sizes="${sizes}"` : ''}
            >
        </picture>
    `;
}

/**
 * Create optimized picture element for Unsplash images
 */
function createUnsplashPicture(src, alt, options = {}) {
    const {
        sizes = '100vw',
        loading = 'lazy',
        className = '',
        width = null,
        height = null,
        quality = 80
    } = options;
    
    // Unsplash supports format conversion via URL params
    const baseUrl = src.split('?')[0];
    const webpUrl = `${baseUrl}?fm=webp&q=${quality}${width ? `&w=${width}` : ''}`;
    const jpgUrl = `${baseUrl}?fm=jpg&q=${quality}${width ? `&w=${width}` : ''}`;
    
    return `
        <picture>
            <source 
                srcset="${webpUrl}" 
                type="image/webp"
            >
            <source 
                srcset="${jpgUrl}" 
                type="image/jpeg"
            >
            <img 
                src="${jpgUrl}" 
                alt="${alt}"
                loading="${loading}"
                class="${className}"
                ${width ? `width="${width}"` : ''}
                ${height ? `height="${height}"` : ''}
                ${sizes !== '100vw' ? `sizes="${sizes}"` : ''}
            >
        </picture>
    `;
}

/**
 * Lazy load images using Intersection Observer
 */
export function initLazyLoading() {
    // Native lazy loading is supported by modern browsers
    // This function adds a fallback for older browsers
    if ('loading' in HTMLImageElement.prototype) {
        // Browser supports native lazy loading
        return;
    }
    
    // Fallback for browsers that don't support native lazy loading
    const images = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                if (img.dataset.srcset) {
                    img.srcset = img.dataset.srcset;
                }
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px'
    });
    
    images.forEach(img => imageObserver.observe(img));
}

/**
 * Preload critical images
 */
export function preloadImage(url, as = 'image') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.href = url;
    
    // Add type for WebP images
    if (url.includes('.webp')) {
        link.type = 'image/webp';
    }
    
    document.head.appendChild(link);
}

/**
 * Get responsive image sizes based on container
 */
export function getResponsiveSizes(containerType = 'full') {
    const sizes = {
        full: '100vw',
        hero: '100vw',
        card: '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
        half: '(min-width: 768px) 50vw, 100vw',
        third: '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
        quarter: '(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw'
    };
    
    return sizes[containerType] || sizes.full;
}

/**
 * Create a low-quality image placeholder (LQIP)
 */
export function createLQIP(src, alt, options = {}) {
    const {
        width = 20,
        height = 20
    } = options;
    
    // For Unsplash, we can get a tiny version
    if (src.includes('unsplash.com')) {
        const baseUrl = src.split('?')[0];
        const lqipUrl = `${baseUrl}?w=${width}&h=${height}&q=10&blur=10`;
        
        return {
            placeholder: lqipUrl,
            style: `background-image: url('${lqipUrl}'); background-size: cover; filter: blur(5px);`
        };
    }
    
    // For local images, return a CSS gradient placeholder
    return {
        placeholder: null,
        style: 'background: linear-gradient(45deg, #f3f4f6 25%, #e5e7eb 25%, #e5e7eb 50%, #f3f4f6 50%, #f3f4f6 75%, #e5e7eb 75%, #e5e7eb);'
    };
}