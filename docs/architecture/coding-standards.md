# Coding Standards

## JavaScript Style Guide

```javascript
// Use ES6+ features
// ✓ Good
const calculateTotal = items => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ✗ Avoid
var calculateTotal = function (items) {
  var sum = 0;
  for (var i = 0; i < items.length; i++) {
    sum += items[i].price;
  }
  return sum;
};

// Async/await over promises
// ✓ Good
async function loadProducts() {
  try {
    const products = await firebaseService.getProducts();
    displayProducts(products);
  } catch (error) {
    showError(error);
  }
}

// ✗ Avoid
function loadProducts() {
  firebaseService
    .getProducts()
    .then(products => displayProducts(products))
    .catch(error => showError(error));
}
```

## File Naming Conventions

```
Components: product-card.js (kebab-case)
Services: auth.service.js (dot notation)
Utils: formatters.js (plural for collections)
Pages: checkout.html (lowercase)
```

## Documentation Standards

```javascript
/**
 * Adds a product to the user's cart
 * @param {string} productId - The product ID to add
 * @param {number} quantity - Quantity to add
 * @returns {Promise<void>}
 * @throws {Error} If product not found or insufficient inventory
 */
async function addToCart(productId, quantity) {
  // Implementation
}
```
