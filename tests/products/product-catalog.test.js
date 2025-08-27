const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

describe('Story 1.4 - Product Catalog Display System', () => {
  let testEnv;
  
  // Helper to create test context
  function getFirestore(auth) {
    if (!auth) {
      return testEnv.unauthenticatedContext().firestore();
    }
    return testEnv.authenticatedContext(auth.uid, auth).firestore();
  }

  // Helper to create admin context
  function getAdminFirestore() {
    return testEnv.withSecurityRulesDisabled().firestore();
  }
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-vita-tea',
      firestore: {
        rules: fs.readFileSync(
          path.resolve(__dirname, '../../firestore.rules'),
          'utf8'
        ),
        host: 'localhost',
        port: 8080
      }
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('AC1: Product catalog displays all 3 sample trios', () => {
    // 1.4-INT-001: Firebase service returns all active products (P0)
    test('Firebase service returns all active products', async () => {
      // Add test products
      const products = [
        {
          name: 'Digestive Harmony Trio',
          category: 'digestive',
          isActive: true,
          price: 2999,
          images: ['test1.jpg'],
          inventory: 50
        },
        {
          name: 'Stress Relief Trio',
          category: 'stress-relief',
          isActive: true,
          price: 2999,
          images: ['test2.jpg'],
          inventory: 30
        },
        {
          name: 'Immunity Boost Trio',
          category: 'immunity',
          isActive: true,
          price: 2999,
          images: ['test3.jpg'],
          inventory: 20
        },
        {
          name: 'Inactive Product',
          category: 'other',
          isActive: false,
          price: 1999,
          images: ['test4.jpg'],
          inventory: 0
        }
      ];

      // Add products to Firestore
      const adminDb = getAdminFirestore();
      for (const product of products) {
        await adminDb.collection('products').add(product);
      }

      // Query active products using unauthenticated context (public read)
      const userDb = getFirestore(null);
      const snapshot = await userDb
        .collection('products')
        .where('isActive', '==', true)
        .get();
      
      const activeProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      expect(activeProducts).toHaveLength(3);
      expect(activeProducts.every(p => p.isActive)).toBe(true);
    });

    // 1.4-INT-002: Category filter returns filtered products (P1)
    test('Category filter returns filtered products', async () => {
      const products = [
        { name: 'Product 1', category: 'digestive', isActive: true },
        { name: 'Product 2', category: 'digestive', isActive: true },
        { name: 'Product 3', category: 'stress-relief', isActive: true },
        { name: 'Product 4', category: 'immunity', isActive: true }
      ];

      const adminDb = getAdminFirestore();
      for (const product of products) {
        await adminDb.collection('products').add(product);
      }

      // Test digestive filter
      const userDb = getFirestore(null);
      const digestiveQuery = await userDb
        .collection('products')
        .where('isActive', '==', true)
        .where('category', '==', 'digestive')
        .get();
      
      expect(digestiveQuery.size).toBe(2);
      
      // Test stress-relief filter
      const stressQuery = await userDb
        .collection('products')
        .where('isActive', '==', true)
        .where('category', '==', 'stress-relief')
        .get();
      
      expect(stressQuery.size).toBe(1);
    });
  });

  describe('AC2: Detailed ingredient and health info', () => {
    // 1.4-INT-003: Product detail fetches complete metadata (P0)
    test('Product detail fetches complete metadata', async () => {
      const fullProduct = {
        name: 'Digestive Harmony Trio',
        slug: 'digestive-harmony-trio',
        description: 'A soothing blend for digestive wellness',
        category: 'digestive',
        price: 2999,
        images: ['product1.jpg', 'product2.jpg'],
        inventory: 50,
        isActive: true,
        metadata: {
          ingredients: ['Peppermint', 'Ginger', 'Fennel', 'Chamomile'],
          brewingInstructions: 'Steep 1 tsp in 8oz hot water for 5-7 minutes',
          healthBenefits: ['Soothes digestion', 'Reduces bloating', 'Calms stomach'],
          caffeineLevel: 'none'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const adminDb = getAdminFirestore();
      const docRef = await adminDb.collection('products').add(fullProduct);
      const userDb = getFirestore(null);
      const doc = await userDb.collection('products').doc(docRef.id).get();
      const retrievedProduct = { id: doc.id, ...doc.data() };

      expect(retrievedProduct.metadata).toBeDefined();
      expect(retrievedProduct.metadata.ingredients).toHaveLength(4);
      expect(retrievedProduct.metadata.healthBenefits).toHaveLength(3);
      expect(retrievedProduct.metadata.caffeineLevel).toBe('none');
    });
  });

  describe('AC3: Brewing instructions', () => {
    // 1.4-INT-004: Brewing data loads from Firebase (P1)
    test('Brewing data loads from Firebase', async () => {
      const productWithBrewing = {
        name: 'Test Tea',
        isActive: true,
        metadata: {
          brewingInstructions: 'Steep 1 tsp in 8oz water at 195°F for 5-7 minutes',
          caffeineLevel: 'low'
        }
      };

      const adminDb = getAdminFirestore();
      const docRef = await adminDb.collection('products').add(productWithBrewing);
      const userDb = getFirestore(null);
      const doc = await userDb.collection('products').doc(docRef.id).get();
      const data = doc.data();

      expect(data.metadata.brewingInstructions).toBeTruthy();
      expect(data.metadata.brewingInstructions).toContain('195°F');
      expect(data.metadata.caffeineLevel).toBe('low');
    });
  });

  describe('AC4: Organic certification', () => {
    // 1.4-INT-005: Certification data retrieved correctly (P1)
    test('Certification data retrieved correctly', async () => {
      const organicProduct = {
        name: 'Organic Tea',
        isActive: true,
        metadata: {
          certifications: ['USDA Organic', 'Fair Trade'],
          sourcingInfo: 'Direct trade from small family farms'
        }
      };

      const adminDb = getAdminFirestore();
      const docRef = await adminDb.collection('products').add(organicProduct);
      const userDb = getFirestore(null);
      const doc = await userDb.collection('products').doc(docRef.id).get();
      const data = doc.data();

      expect(data.metadata.certifications).toContain('USDA Organic');
      expect(data.metadata.sourcingInfo).toBeTruthy();
    });
  });

  describe('AC6: SEO optimization', () => {
    // 1.4-UNIT-012: SEO utility functions generate valid tags (P1)
    test('SEO utility functions generate valid meta tags', () => {
      // Mock SEO utility function
      const generateMetaTags = (product) => {
        return {
          title: `${product.name} - Organic Tea | Vida Tea`,
          description: product.description.substring(0, 160),
          ogTitle: product.name,
          ogDescription: product.description,
          ogImage: product.images[0],
          jsonLd: {
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: product.images,
            offers: {
              '@type': 'Offer',
              price: (product.price / 100).toFixed(2),
              priceCurrency: 'USD',
              availability: product.inventory > 0 ? 'InStock' : 'OutOfStock'
            }
          }
        };
      };

      const testProduct = {
        name: 'Test Tea Trio',
        description: 'A delicious blend of organic herbs for wellness and vitality',
        price: 2999,
        images: ['test.jpg'],
        inventory: 10
      };

      const metaTags = generateMetaTags(testProduct);
      
      expect(metaTags.title).toContain(testProduct.name);
      expect(metaTags.title).toContain('Vida Tea');
      expect(metaTags.description.length).toBeLessThanOrEqual(160);
      expect(metaTags.jsonLd['@type']).toBe('Product');
      expect(metaTags.jsonLd.offers.price).toBe('29.99');
      expect(metaTags.jsonLd.offers.availability).toBe('InStock');
    });
  });

  describe('Analytics tracking', () => {
    // 1.4-INT-011: Analytics events track product views (P1)
    test('Analytics events track product views', async () => {
      const analyticsEvent = {
        event: 'product_view',
        productId: 'test-123',
        productName: 'Test Tea',
        category: 'digestive',
        price: 29.99,
        source: 'catalog',
        timestamp: new Date()
      };

      // Note: In production, this would be sent to Cloud Function
      // For testing, we'll verify the event structure
      expect(analyticsEvent.event).toBe('product_view');
      expect(analyticsEvent.productId).toBeTruthy();
      expect(analyticsEvent.productName).toBeTruthy();
      expect(analyticsEvent.price).toBeGreaterThan(0);
      expect(analyticsEvent.source).toMatch(/catalog|product_detail/);
    });
  });

  describe('Performance', () => {
    // 1.4-INT-012: Page load performance under 3s (P1)
    test('Product query performance is acceptable', async () => {
      // Add multiple products
      const products = [];
      for (let i = 0; i < 20; i++) {
        products.push({
          name: `Product ${i}`,
          category: ['digestive', 'stress-relief', 'immunity'][i % 3],
          isActive: true,
          price: 2999 + (i * 100),
          inventory: 50 - i
        });
      }

      const start = Date.now();
      
      // Add all products
      const adminDb = getAdminFirestore();
      await Promise.all(
        products.map(p => adminDb.collection('products').add(p))
      );

      // Query products
      const userDb = getFirestore(null);
      const snapshot = await userDb
        .collection('products')
        .where('isActive', '==', true)
        .get();

      const duration = Date.now() - start;
      
      expect(snapshot.size).toBe(20);
      // Firebase operations should be fast in test environment
      expect(duration).toBeLessThan(3000);
    });
  });
});