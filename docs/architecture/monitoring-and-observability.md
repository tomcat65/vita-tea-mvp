# Monitoring and Observability

## Firebase Analytics Setup

```javascript
// public/js/analytics-config.js
// Custom event tracking
const Analytics = {
  // E-commerce events
  trackProductView(product) {
    gtag('event', 'view_item', {
      currency: 'USD',
      value: product.price / 100,
      items: [
        {
          item_id: product.productId,
          item_name: product.name,
          item_category: product.category,
          price: product.price / 100,
          quantity: 1,
        },
      ],
    });
  },

  trackAddToCart(product, quantity) {
    gtag('event', 'add_to_cart', {
      currency: 'USD',
      value: (product.price * quantity) / 100,
      items: [
        {
          item_id: product.productId,
          item_name: product.name,
          quantity: quantity,
        },
      ],
    });
  },

  trackPurchase(order) {
    gtag('event', 'purchase', {
      transaction_id: order.orderId,
      value: order.total / 100,
      currency: 'USD',
      shipping: order.shipping / 100,
      tax: order.tax / 100,
      items: order.items.map(item => ({
        item_id: item.productId,
        item_name: item.productName,
        price: item.price / 100,
        quantity: item.quantity,
      })),
    });
  },

  // Conversion funnel tracking
  trackCheckoutStep(step, additionalData = {}) {
    gtag('event', 'checkout_progress', {
      checkout_step: step,
      ...additionalData,
    });
  },
};
```

## Performance Monitoring

```javascript
// public/js/performance-monitor.js
// Firebase Performance Monitoring
const perf = firebase.performance();

// Custom traces
async function measureProductLoad() {
  const trace = perf.trace('load_products');
  trace.start();

  try {
    const products = await loadProducts();
    trace.putMetric('product_count', products.length);
    trace.stop();
  } catch (error) {
    trace.putAttribute('error', error.message);
    trace.stop();
  }
}

// Web Vitals reporting
import { getCLS, getFID, getLCP } from 'web-vitals';

function sendToAnalytics(metric) {
  gtag('event', metric.name, {
    value: Math.round(metric.value),
    event_category: 'Web Vitals',
    event_label: metric.id,
    non_interaction: true,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
```

## Custom Dashboard

```javascript
// Admin dashboard metrics
async function loadDashboardMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Real-time order count
  const ordersToday = await firebase
    .firestore()
    .collection('orders')
    .where('createdAt', '>=', today)
    .get();

  // Revenue calculation
  const revenue = ordersToday.docs.reduce((sum, doc) => {
    return sum + doc.data().total;
  }, 0);

  // Conversion funnel
  const sessions = await firebase
    .firestore()
    .collection('analytics')
    .where('eventType', '==', 'session_start')
    .where('createdAt', '>=', today)
    .get();

  const checkouts = await firebase
    .firestore()
    .collection('analytics')
    .where('eventType', '==', 'checkout_start')
    .where('createdAt', '>=', today)
    .get();

  return {
    ordersToday: ordersToday.size,
    revenueToday: revenue / 100,
    conversionRate: ((ordersToday.size / sessions.size) * 100).toFixed(2),
  };
}
```

## Alert Configuration

```javascript
// Cloud Function for monitoring alerts
exports.monitorInventory = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async () => {
    const lowStockProducts = await db
      .collection('products')
      .where('inventory', '<', 10)
      .where('isActive', '==', true)
      .get();

    if (!lowStockProducts.empty) {
      // Send alert email
      await sendAdminEmail({
        subject: 'Low Inventory Alert',
        products: lowStockProducts.docs.map(doc => ({
          name: doc.data().name,
          inventory: doc.data().inventory,
        })),
      });
    }
  });
```
