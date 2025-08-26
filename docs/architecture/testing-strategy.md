# Testing Strategy

## Unit Testing

```javascript
// functions/src/__tests__/order.service.test.ts
import { OrderService } from '../services/order.service';
import { mockFirestore } from 'firebase-functions-test';

describe('OrderService', () => {
  let orderService: OrderService;
  
  beforeEach(() => {
    orderService = new OrderService();
  });
  
  test('calculateOrderTotals includes tax and shipping', async () => {
    const items = [{
      productId: 'tea123',
      quantity: 2,
      price: 2499
    }];
    
    const result = await orderService.calculateTotals(items, 'OR');
    
    expect(result.subtotal).toBe(4998);
    expect(result.tax).toBeGreaterThan(0);
    expect(result.shipping).toBe(599);
    expect(result.total).toBe(result.subtotal + result.tax + result.shipping);
  });
});
```

## Integration Testing

```javascript
// test/integration/checkout.test.js
describe('Checkout Flow', () => {
  before(async () => {
    // Start emulators
    await firebase.initializeTestApp({
      projectId: 'test-project',
      auth: { uid: 'test-user' }
    });
  });
  
  it('completes purchase successfully', async () => {
    // Add to cart
    await firebase.firestore().collection('carts').doc('test-user').set({
      items: [{ productId: 'tea123', quantity: 1 }]
    });
    
    // Create payment intent
    const createIntent = firebase.functions().httpsCallable('stripeCreateIntent');
    const result = await createIntent({ shippingAddress: mockAddress });
    
    expect(result.data).to.have.property('clientSecret');
    expect(result.data).to.have.property('orderId');
  });
});
```

## Manual Testing Checklist

```markdown
# Pre-Deploy Testing Checklist

## Critical Paths
- [ ] User registration with email
- [ ] Product browsing and filtering
- [ ] Add to cart (logged in)
- [ ] Add to cart (guest)
- [ ] Checkout with Stripe
- [ ] Order confirmation email
- [ ] Admin login
- [ ] Admin order management

## Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Performance Testing
- [ ] Page load < 3s on 3G
- [ ] Time to Interactive < 5s
- [ ] No console errors
- [ ] Images optimized
```
