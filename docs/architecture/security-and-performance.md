# Security and Performance

## Security Best Practices

```javascript
// firestore.rules - Comprehensive security
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Security functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function isValidProduct(product) {
      return product.keys().hasAll(['name', 'price', 'category']) &&
             product.price is int &&
             product.price > 0;
    }
    
    // Rate limiting helper
    function rateLimitWrite() {
      return request.time > resource.data.lastWrite + duration(1, 's');
    }
    
    // Apply rules
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow update: if isOwner(userId) && rateLimitWrite();
    }
  }
}
```

## Performance Optimization

```javascript
// public/js/performance.js
// 1. Lazy loading images
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      imageObserver.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img => {
  imageObserver.observe(img);
});

// 2. Service Worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// 3. Firestore query optimization
async function getProductsPaginated(lastDoc = null, limit = 12) {
  let query = firebase.firestore()
    .collection('products')
    .where('isActive', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(limit);
    
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }
  
  return query.get();
}
```

## Security Headers

```javascript
// firebase.json - Security headers
{
  "hosting": {
    "headers": [{
      "source": "**",
      "headers": [{
        "key": "X-Content-Type-Options",
        "value": "nosniff"
      }, {
        "key": "X-Frame-Options",
        "value": "SAMEORIGIN"
      }, {
        "key": "X-XSS-Protection",
        "value": "1; mode=block"
      }, {
        "key": "Referrer-Policy",
        "value": "strict-origin-when-cross-origin"
      }, {
        "key": "Content-Security-Policy",
        "value": "default-src 'self' https://*.firebaseapp.com https://*.googleapis.com"
      }]
    }]
  }
}
```
