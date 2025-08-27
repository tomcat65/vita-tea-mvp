// Auth initialization and UI management
import { authService } from './services/auth.service.js';

// Auth UI component
class AuthUI {
  constructor() {
    this.currentUser = null;
    this.initialized = false;
  }

  async initialize() {
    // Wait for auth service
    await authService.initialize();
    
    // Listen for auth state changes
    authService.onUserChange((user) => {
      this.currentUser = user;
      this.updateUI();
    });
    
    this.initialized = true;
  }

  updateUI() {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) {
      return;
    }

    // Clear existing content
    authContainer.innerHTML = '';

    if (this.currentUser) {
      // User is signed in
      const userDiv = document.createElement('div');
      userDiv.className = 'flex items-center gap-4';
      
      const greetingSpan = document.createElement('span');
      greetingSpan.className = 'text-sm text-gray-700';
      greetingSpan.textContent = `Hello, ${this.currentUser.displayName || this.currentUser.email}`;
      
      const accountLink = document.createElement('a');
      accountLink.href = '/account';
      accountLink.className = 'text-sm text-green-600 hover:text-green-700';
      accountLink.textContent = 'My Account';
      
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logout-btn';
      logoutBtn.className = 'text-sm text-gray-600 hover:text-gray-800';
      logoutBtn.textContent = 'Sign Out';
      logoutBtn.addEventListener('click', () => this.handleLogout());
      
      userDiv.appendChild(greetingSpan);
      userDiv.appendChild(accountLink);
      userDiv.appendChild(logoutBtn);
      authContainer.appendChild(userDiv);
    } else {
      // User is not signed in
      const guestDiv = document.createElement('div');
      guestDiv.className = 'flex items-center gap-4';
      
      const signInLink = document.createElement('a');
      signInLink.href = '/login.html';
      signInLink.className = 'text-sm text-green-600 hover:text-green-700';
      signInLink.textContent = 'Sign In';
      
      const createAccountLink = document.createElement('a');
      createAccountLink.href = '/register.html';
      createAccountLink.className = 'text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700';
      createAccountLink.textContent = 'Create Account';
      
      guestDiv.appendChild(signInLink);
      guestDiv.appendChild(createAccountLink);
      authContainer.appendChild(guestDiv);
    }
  }

  async handleLogout() {
    const result = await authService.signOut();
    if (result.success) {
      window.location.href = '/';
    } else {
      console.error('Error signing out:', result.error);
      // In production, show a proper toast/modal notification instead
    }
  }

  // Get current user
  getUser() {
    return this.currentUser;
  }

  // Check if user is signed in
  isSignedIn() {
    return this.currentUser !== null;
  }
}

// Export singleton instance
export const authUI = new AuthUI();

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => authUI.initialize());
} else {
  authUI.initialize();
}