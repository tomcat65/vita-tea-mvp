/**
 * Product Card Web Component
 * Displays product information with shadow DOM encapsulation
 * 
 * @element product-card
 * @attribute {string} product-id - The unique product identifier
 * @attribute {string} product-data - JSON string of product data
 * @fires add-to-cart - Fired when add to cart button is clicked
 * @fires view-product - Fired when view details button is clicked
 */
class ProductCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['product-id', 'product-data'];
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    /**
     * Get product data from attributes
     * @returns {Object|null} Parsed product data
     */
    getProductData() {
        try {
            const data = this.getAttribute('product-data');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to parse product data:', error);
            return null;
        }
    }

    /**
     * Format price from cents to dollars
     * @param {number} cents - Price in cents
     * @returns {string} Formatted price string
     */
    formatPrice(cents) {
        return `$${(cents / 100).toFixed(2)}`;
    }

    /**
     * Get category display name
     * @param {string} category - Category slug
     * @returns {string} Human-readable category name
     */
    getCategoryName(category) {
        const categoryMap = {
            'digestive': 'Digestive Support',
            'stress-relief': 'Stress Relief',
            'immunity': 'Immunity Boost'
        };
        return categoryMap[category] || category;
    }

    /**
     * Render the component
     */
    render() {
        const product = this.getProductData();
        
        if (!product) {
            this.shadowRoot.innerHTML = '<div class="error">Product data not available</div>';
            return;
        }

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 100%;
                }

                .card {
                    background: white;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }

                .card:hover {
                    transform: translateY(-4px);
                }

                .image-container {
                    position: relative;
                    width: 100%;
                    height: 256px;
                    overflow: hidden;
                    background: #f3f4f6;
                }

                .image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .card:hover .image {
                    transform: scale(1.05);
                }

                .badge {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: #10b981;
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .content {
                    padding: 1.5rem;
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                }

                .category {
                    color: #10b981;
                    font-size: 0.875rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }

                .name {
                    color: #1f2937;
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    line-height: 1.4;
                }

                .description {
                    color: #6b7280;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    margin-bottom: 1rem;
                    flex-grow: 1;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                }

                .footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: auto;
                }

                .price {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1f2937;
                }

                .buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                button {
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                }

                .view-btn {
                    background: transparent;
                    color: #10b981;
                    border: 1px solid #10b981;
                }

                .view-btn:hover {
                    background: #10b981;
                    color: white;
                }

                .add-btn {
                    background: #10b981;
                    color: white;
                }

                .add-btn:hover {
                    background: #059669;
                    transform: scale(1.05);
                }

                .add-btn:active {
                    transform: scale(0.95);
                }

                .inventory-low {
                    color: #ef4444;
                    font-size: 0.75rem;
                    margin-top: 0.25rem;
                }

                .error {
                    padding: 2rem;
                    text-align: center;
                    color: #6b7280;
                }

                @media (max-width: 640px) {
                    .footer {
                        flex-direction: column;
                        gap: 1rem;
                        align-items: flex-start;
                    }

                    .buttons {
                        width: 100%;
                        flex-direction: column;
                    }

                    button {
                        width: 100%;
                    }
                }
            </style>

            <article class="card">
                <div class="image-container">
                    <img 
                        class="image" 
                        src="${product.images?.[0] || '/images/placeholder.jpg'}" 
                        alt="${product.name}"
                        loading="lazy"
                    >
                    ${product.metadata?.caffeineLevel === 'none' ? '<span class="badge">Caffeine Free</span>' : ''}
                </div>
                
                <div class="content">
                    <div class="category">${this.getCategoryName(product.category)}</div>
                    <h3 class="name">${product.name}</h3>
                    <p class="description">${product.description}</p>
                    
                    <div class="footer">
                        <div>
                            <div class="price">${this.formatPrice(product.price)}</div>
                            ${product.inventory < 10 && product.inventory > 0 ? 
                                `<div class="inventory-low">Only ${product.inventory} left in stock</div>` : 
                                ''
                            }
                        </div>
                        <div class="buttons">
                            <button class="view-btn" data-action="view">
                                View Details
                            </button>
                            <button class="add-btn" data-action="add" ${product.inventory === 0 ? 'disabled' : ''}>
                                ${product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * Attach event listeners to interactive elements
     */
    attachEventListeners() {
        const buttons = this.shadowRoot.querySelectorAll('button[data-action]');
        
        buttons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const action = button.dataset.action;
                const product = this.getProductData();
                
                if (!product) {return;}

                if (action === 'view') {
                    this.dispatchEvent(new CustomEvent('view-product', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            productId: product.id || this.getAttribute('product-id')
                        }
                    }));
                } else if (action === 'add' && product.inventory > 0) {
                    this.dispatchEvent(new CustomEvent('add-to-cart', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            productId: product.id || this.getAttribute('product-id'),
                            productName: product.name,
                            price: product.price,
                            category: product.category
                        }
                    }));
                }
            });
        });
    }
}

// Register the custom element
customElements.define('product-card', ProductCard);