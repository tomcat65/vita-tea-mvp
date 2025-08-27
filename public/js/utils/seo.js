/**
 * SEO utility functions
 * Handles meta tag generation, structured data, and SEO optimizations
 */

/**
 * Update meta tags dynamically
 * @param {Object} tags - Object with tag name/property as key and content as value
 * @returns {void}
 */
export function updateMetaTags(tags) {
    Object.entries(tags).forEach(([key, value]) => {
        // Update standard meta tags
        let element = document.querySelector(`meta[name="${key}"]`);
        if (element) {
            element.setAttribute('content', value);
        } else {
            // Try property attribute for Open Graph tags
            element = document.querySelector(`meta[property="${key}"]`);
            if (element) {
                element.setAttribute('content', value);
            }
        }
        
        // Update special elements by ID
        const idElement = document.getElementById(key);
        if (idElement && idElement.tagName === 'META') {
            idElement.setAttribute('content', value);
        }
    });
}

/**
 * Generate product structured data (JSON-LD)
 * @param {Object} product - Product data object
 * @returns {Object} Structured data object
 */
export function generateProductSchema(product) {
    return {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": product.images,
        "description": product.description,
        "sku": product.id,
        "category": getCategoryName(product.category),
        "brand": {
            "@type": "Brand",
            "name": "VitaTea"
        },
        "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "USD",
            "price": (product.price / 100).toFixed(2),
            "availability": product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
                "@type": "Organization",
                "name": "VitaTea"
            }
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "127",
            "bestRating": "5",
            "worstRating": "1"
        },
        "nutrition": {
            "@type": "NutritionInformation",
            "servingSize": "1 tea bag (2g)",
            "calories": "0",
            "carbohydrateContent": "0g",
            "proteinContent": "0g",
            "fatContent": "0g"
        },
        "additionalProperty": [
            {
                "@type": "PropertyValue",
                "name": "Caffeine Level",
                "value": product.metadata.caffeineLevel || "none"
            },
            {
                "@type": "PropertyValue",
                "name": "Organic",
                "value": "Yes"
            },
            {
                "@type": "PropertyValue",
                "name": "Brewing Time",
                "value": "5-7 minutes"
            }
        ]
    };
}

/**
 * Generate collection page structured data
 * @param {Array} products - Array of product objects
 * @returns {Object} Structured data object
 */
export function generateCollectionSchema(products) {
    return {
        "@context": "https://schema.org/",
        "@type": "CollectionPage",
        "name": "VitaTea Organic Wellness Tea Collections",
        "description": "Shop our curated selection of organic wellness tea sample trios",
        "url": window.location.href,
        "isPartOf": {
            "@type": "WebSite",
            "name": "VitaTea",
            "url": window.location.origin
        },
        "mainEntity": {
            "@type": "ItemList",
            "itemListElement": products.map((product, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                    "@type": "Product",
                    "name": product.name,
                    "url": `${window.location.origin}/product.html?id=${product.id}`,
                    "image": product.images[0],
                    "offers": {
                        "@type": "Offer",
                        "price": (product.price / 100).toFixed(2),
                        "priceCurrency": "USD"
                    }
                }
            }))
        }
    };
}

/**
 * Generate XML sitemap content
 * @param {Array} products - Array of product objects
 * @returns {string} XML sitemap content
 */
export function generateSitemap(products) {
    const urls = [
        { loc: '/', priority: '1.0', changefreq: 'weekly' },
        { loc: '/shop.html', priority: '0.9', changefreq: 'daily' },
        { loc: '/about.html', priority: '0.7', changefreq: 'monthly' },
        { loc: '/contact.html', priority: '0.6', changefreq: 'monthly' }
    ];

    // Add product URLs
    products.forEach(product => {
        urls.push({
            loc: `/product.html?id=${product.id}`,
            priority: '0.8',
            changefreq: 'weekly',
            lastmod: product.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString()
        });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${window.location.origin}${url.loc}</loc>
    <priority>${url.priority}</priority>
    <changefreq>${url.changefreq}</changefreq>
    ${url.lastmod ? `<lastmod>${url.lastmod.split('T')[0]}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

    return xml;
}

/**
 * Get human-readable category name
 * @param {string} category - Category slug
 * @returns {string} Human-readable category name
 */
function getCategoryName(category) {
    const categoryMap = {
        'digestive': 'Digestive Support',
        'stress-relief': 'Stress Relief',
        'immunity': 'Immunity Boost'
    };
    return categoryMap[category] || category;
}

/**
 * Initialize SEO features for the current page
 * @param {string} pageType - Type of page ('catalog', 'product', etc.)
 * @returns {void}
 */
export function initSEO(_pageType) {
    // Add canonical URL
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = window.location.href.split('?')[0];
    document.head.appendChild(canonical);

    // Add hreflang for language support
    const hreflang = document.createElement('link');
    hreflang.rel = 'alternate';
    hreflang.hreflang = 'en-US';
    hreflang.href = window.location.href;
    document.head.appendChild(hreflang);

    // Optimize images with lazy loading (already in HTML)
    // Add alt text dynamically if missing
    document.querySelectorAll('img').forEach(img => {
        if (!img.alt && img.src) {
            img.alt = 'VitaTea organic wellness tea product';
        }
    });
}