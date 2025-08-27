// Auth Guard - Route protection for authenticated pages
import { authService } from './services/auth.service.js';

// Protected routes configuration
const protectedRoutes = [
  '/account',
  '/orders',
  '/checkout',
  '/admin'
];

// Admin-only routes
const adminRoutes = [
  '/admin'
];

// Auth guard class
class AuthGuard {
  constructor() {
    this.initialized = false;
    this.currentPath = window.location.pathname;
  }

  async initialize() {
    // Wait for auth service to be ready
    await authService.initialize();
    
    // Listen for auth state changes
    authService.onUserChange((user) => {
      this.handleAuthStateChange(user);
    });
    
    this.initialized = true;
    
    // Check initial route
    this.checkRoute();
  }

  handleAuthStateChange(user) {
    if (!user && this.isProtectedRoute(this.currentPath)) {
      // User signed out on protected route - redirect to login
      this.redirectToLogin();
    }
  }

  isProtectedRoute(path) {
    return protectedRoutes.some(route => path.startsWith(route));
  }

  isAdminRoute(path) {
    return adminRoutes.some(route => path.startsWith(route));
  }

  async checkRoute(path = window.location.pathname) {
    this.currentPath = path;
    
    if (!this.isProtectedRoute(path)) {
      return true; // Allow access
    }
    
    // Check if user is authenticated
    if (!authService.isSignedIn()) {
      this.redirectToLogin();
      return false;
    }
    
    // Check if email is verified for certain routes
    if (path.startsWith('/checkout') && !authService.isEmailVerified()) {
      this.showVerificationRequired();
      return false;
    }
    
    // Check admin access
    if (this.isAdminRoute(path)) {
      const hasAdminAccess = await this.checkAdminAccess();
      if (!hasAdminAccess) {
        this.redirectToHome();
        return false;
      }
    }
    
    return true; // Allow access
  }

  redirectToLogin() {
    // Save intended destination
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login.html?returnUrl=${returnUrl}`;
  }

  redirectToHome() {
    window.location.href = '/';
  }

  showVerificationRequired() {
    // Create modal elements safely
    const modalDiv = document.createElement('div');
    modalDiv.id = 'auth-modal';
    modalDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'bg-white p-8 rounded-lg max-w-md';
    
    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold mb-4';
    title.textContent = 'Email Verification Required';
    
    const message = document.createElement('p');
    message.className = 'mb-6';
    message.textContent = 'Please verify your email address to continue with checkout.';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex gap-4';
    
    const resendButton = document.createElement('button');
    resendButton.className = 'px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700';
    resendButton.textContent = 'Resend Verification Email';
    resendButton.addEventListener('click', () => this.resendVerification());
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => this.closeModal());
    
    buttonContainer.appendChild(resendButton);
    buttonContainer.appendChild(cancelButton);
    
    contentDiv.appendChild(title);
    contentDiv.appendChild(message);
    contentDiv.appendChild(buttonContainer);
    modalDiv.appendChild(contentDiv);
    
    document.body.appendChild(modalDiv);
  }

  async resendVerification() {
    const user = authService.getCurrentUser();
    if (user) {
      try {
        const { sendEmailVerification } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        await sendEmailVerification(user);
        this.showNotification('Verification email sent! Please check your inbox.', 'success');
        this.closeModal();
      } catch (error) {
        console.error('Error sending verification email:', error);
        this.showNotification('Error sending verification email. Please try again.', 'error');
      }
    }
  }

  closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.remove();
    }
  }

  // Get return URL from query params
  getReturnUrl() {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl');
    return returnUrl ? decodeURIComponent(returnUrl) : '/';
  }

  // Navigate to return URL or home
  navigateToReturnUrl() {
    const returnUrl = this.getReturnUrl();
    window.location.href = returnUrl;
  }

  // Check if current user has admin claims
  async checkAdminAccess() {
    const user = authService.getCurrentUser();
    if (!user) {
      return false;
    }

    try {
      // Get the ID token with custom claims
      const idTokenResult = await user.getIdTokenResult();
      const claims = idTokenResult.claims;
      
      // Check for admin custom claim
      return claims.admin === true;
    } catch (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
  }

  // Show notification instead of alert
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// Export singleton instance
export const authGuard = new AuthGuard();

// Auto-initialize if on a protected route
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => authGuard.initialize());
} else {
  authGuard.initialize();
}