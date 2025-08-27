// CSRF Protection utility
// Generates and validates CSRF tokens for state-changing operations

class CSRFProtection {
  constructor() {
    this.tokenKey = 'vita-tea-csrf-token';
    this.tokenExpiry = 4 * 60 * 60 * 1000; // 4 hours
  }

  // Generate a new CSRF token
  generateToken() {
    const token = this.generateRandomString(32);
    const expiry = Date.now() + this.tokenExpiry;
    
    const tokenData = {
      token,
      expiry,
      createdAt: Date.now()
    };
    
    // Store in sessionStorage (per-tab)
    sessionStorage.setItem(this.tokenKey, JSON.stringify(tokenData));
    
    return token;
  }

  // Get current CSRF token or generate new one if expired
  getToken() {
    const stored = sessionStorage.getItem(this.tokenKey);
    
    if (!stored) {
      return this.generateToken();
    }
    
    try {
      const tokenData = JSON.parse(stored);
      
      // Check if token is expired
      if (Date.now() >= tokenData.expiry) {
        return this.generateToken();
      }
      
      return tokenData.token;
    } catch (error) {
      // If parsing fails, generate new token
      return this.generateToken();
    }
  }

  // Validate a CSRF token
  validateToken(token) {
    if (!token) {
      return false;
    }
    
    const stored = sessionStorage.getItem(this.tokenKey);
    if (!stored) {
      return false;
    }
    
    try {
      const tokenData = JSON.parse(stored);
      
      // Check if token matches and not expired
      return tokenData.token === token && Date.now() < tokenData.expiry;
    } catch (error) {
      return false;
    }
  }

  // Add CSRF token to request headers
  addTokenToHeaders(headers = {}) {
    return {
      ...headers,
      'X-CSRF-Token': this.getToken()
    };
  }

  // Add CSRF token to form data
  addTokenToFormData(formData) {
    if (formData instanceof FormData) {
      formData.append('csrf_token', this.getToken());
    } else if (typeof formData === 'object') {
      return {
        ...formData,
        csrf_token: this.getToken()
      };
    }
    return formData;
  }

  // Generate cryptographically secure random string
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    
    return result;
  }

  // Clear token (on logout)
  clearToken() {
    sessionStorage.removeItem(this.tokenKey);
  }
}

// Export singleton instance
export const csrf = new CSRFProtection();