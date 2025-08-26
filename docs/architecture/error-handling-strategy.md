# Error Handling Strategy

## Client-Side Error Handling

```javascript
// public/js/utils/error-handler.js
class ErrorHandler {
  static handle(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    // User-friendly messages
    const userMessage = this.getUserMessage(error);
    this.showNotification(userMessage, 'error');
    
    // Track in analytics
    analytics.trackEvent('error', {
      message: error.message,
      context,
      stack: error.stack
    });
  }
  
  static getUserMessage(error) {
    const errorMap = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'insufficient-inventory': 'Sorry, not enough items in stock',
      'payment-failed': 'Payment failed. Please try again.'
    };
    
    return errorMap[error.code] || 'Something went wrong. Please try again.';
  }
  
  static showNotification(message, type = 'info') {
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 5000);
  }
}

// Global error handler
window.addEventListener('unhandledrejection', event => {
  ErrorHandler.handle(event.reason, 'Unhandled Promise');
});
```

## Server-Side Error Handling

```typescript
// functions/src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('validation-error', message, 400);
  }
}

export class InsufficientInventoryError extends AppError {
  constructor(productId: string, available: number) {
    super(
      'insufficient-inventory',
      `Insufficient inventory for product ${productId}. Available: ${available}`,
      409
    );
  }
}

// Usage in Cloud Functions
export const processOrder = functions.https.onCall(async (data, context) => {
  try {
    // Validate input
    if (!data.items || !Array.isArray(data.items)) {
      throw new ValidationError('Invalid order items');
    }
    
    // Process order...
  } catch (error) {
    if (error instanceof AppError) {
      throw new functions.https.HttpsError(
        error.code,
        error.message
      );
    }
    
    // Log unexpected errors
    console.error('Unexpected error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An unexpected error occurred'
    );
  }
});
```
