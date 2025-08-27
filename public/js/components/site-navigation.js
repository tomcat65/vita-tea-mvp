/**
 * Site Navigation Web Component
 * Provides responsive navigation with authentication awareness
 */

import { auth } from '../services/firebase.service.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

class SiteNavigation extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.unsubscribeAuth = null;
    }
    
    connectedCallback() {
        this.render();
        this.initializeAuthListener();
        this.initializeEventListeners();
    }
    
    disconnectedCallback() {
        if (this.unsubscribeAuth) {
            this.unsubscribeAuth();
        }
    }
    
    render() {
        const currentPath = window.location.pathname;
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    background-color: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                
                nav {
                    max-width: 80rem;
                    margin: 0 auto;
                    padding: 0 1rem;
                }
                
                .nav-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 4rem;
                }
                
                .logo {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #16a34a;
                    text-decoration: none;
                    font-family: 'Playfair Display', serif;
                }
                
                .desktop-menu {
                    display: none;
                    align-items: center;
                    gap: 2rem;
                }
                
                .menu-item {
                    color: #374151;
                    text-decoration: none;
                    font-weight: 500;
                    position: relative;
                    transition: color 0.2s;
                }
                
                .menu-item:hover {
                    color: #16a34a;
                }
                
                .menu-item.active {
                    color: #16a34a;
                }
                
                .menu-item.active::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background-color: #16a34a;
                }
                
                .dropdown {
                    position: relative;
                }
                
                .dropdown-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    margin-top: 0.5rem;
                    background: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    padding: 0.5rem 0;
                    min-width: 200px;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px);
                    transition: all 0.2s;
                }
                
                .dropdown:hover .dropdown-menu {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }
                
                .dropdown-item {
                    display: block;
                    padding: 0.5rem 1rem;
                    color: #374151;
                    text-decoration: none;
                    transition: background-color 0.2s;
                }
                
                .dropdown-item:hover {
                    background-color: #f3f4f6;
                    color: #16a34a;
                }
                
                .auth-section {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .btn {
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    text-decoration: none;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                
                .btn-secondary {
                    color: #16a34a;
                    background: transparent;
                }
                
                .btn-secondary:hover {
                    background-color: #f0fdf4;
                }
                
                .btn-primary {
                    color: white;
                    background-color: #16a34a;
                }
                
                .btn-primary:hover {
                    background-color: #15803d;
                }
                
                .mobile-menu-btn {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    width: 2rem;
                    height: 2rem;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                }
                
                .hamburger-line {
                    width: 1.5rem;
                    height: 2px;
                    background-color: #374151;
                    margin: 3px 0;
                    transition: all 0.3s;
                }
                
                .mobile-menu-btn.open .hamburger-line:nth-child(1) {
                    transform: rotate(45deg) translate(5px, 5px);
                }
                
                .mobile-menu-btn.open .hamburger-line:nth-child(2) {
                    opacity: 0;
                }
                
                .mobile-menu-btn.open .hamburger-line:nth-child(3) {
                    transform: rotate(-45deg) translate(5px, -5px);
                }
                
                .mobile-menu {
                    position: fixed;
                    top: 4rem;
                    right: -100%;
                    width: 100%;
                    max-width: 400px;
                    height: calc(100vh - 4rem);
                    background: white;
                    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
                    transition: right 0.3s ease-out;
                    overflow-y: auto;
                }
                
                .mobile-menu.open {
                    right: 0;
                }
                
                .mobile-menu-content {
                    padding: 1rem;
                }
                
                .mobile-menu-item {
                    display: block;
                    padding: 0.75rem 1rem;
                    color: #374151;
                    text-decoration: none;
                    font-weight: 500;
                    border-radius: 0.375rem;
                    transition: background-color 0.2s;
                }
                
                .mobile-menu-item:hover {
                    background-color: #f3f4f6;
                    color: #16a34a;
                }
                
                .mobile-menu-divider {
                    height: 1px;
                    background-color: #e5e7eb;
                    margin: 1rem 0;
                }
                
                .user-info {
                    padding: 1rem;
                    background-color: #f9fafb;
                    border-radius: 0.5rem;
                    margin-bottom: 1rem;
                }
                
                .user-email {
                    color: #6b7280;
                    font-size: 0.875rem;
                    margin-bottom: 0.5rem;
                }
                
                @media (min-width: 768px) {
                    .desktop-menu {
                        display: flex;
                    }
                    
                    .mobile-menu-btn {
                        display: none;
                    }
                    
                    nav {
                        padding: 0 1.5rem;
                    }
                }
                
                @media (min-width: 1024px) {
                    nav {
                        padding: 0 2rem;
                    }
                }
            </style>
            
            <nav>
                <div class="nav-container">
                    <a href="/" class="logo">Vita Tea</a>
                    
                    <!-- Desktop Menu -->
                    <div class="desktop-menu">
                        <div class="dropdown">
                            <a href="/shop.html" class="menu-item ${currentPath === '/shop.html' ? 'active' : ''}">
                                Shop
                            </a>
                            <div class="dropdown-menu">
                                <a href="/shop.html?filter=type" class="dropdown-item">Shop by Type</a>
                                <a href="/shop.html?filter=benefit" class="dropdown-item">Shop by Benefit</a>
                                <a href="/shop.html?filter=gift" class="dropdown-item">Gift Sets</a>
                                <a href="/shop.html?product=sample-trio" class="dropdown-item">Sample Trio</a>
                            </div>
                        </div>
                        
                        <a href="/about.html" class="menu-item ${currentPath === '/about.html' ? 'active' : ''}">
                            About
                        </a>
                        
                        <a href="/learn.html" class="menu-item ${currentPath === '/learn.html' ? 'active' : ''}">
                            Learn
                        </a>
                        
                        <div class="auth-section">
                            <span class="auth-loading">Loading...</span>
                        </div>
                    </div>
                    
                    <!-- Mobile Menu Button -->
                    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Toggle navigation menu">
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                    </button>
                </div>
            </nav>
            
            <!-- Mobile Menu -->
            <div class="mobile-menu" id="mobileMenu">
                <div class="mobile-menu-content">
                    <div class="mobile-auth-section">
                        <span class="auth-loading">Loading...</span>
                    </div>
                    
                    <div class="mobile-menu-divider"></div>
                    
                    <a href="/shop.html" class="mobile-menu-item">Shop All</a>
                    <a href="/shop.html?filter=type" class="mobile-menu-item">Shop by Type</a>
                    <a href="/shop.html?filter=benefit" class="mobile-menu-item">Shop by Benefit</a>
                    <a href="/shop.html?filter=gift" class="mobile-menu-item">Gift Sets</a>
                    <a href="/shop.html?product=sample-trio" class="mobile-menu-item">Sample Trio</a>
                    
                    <div class="mobile-menu-divider"></div>
                    
                    <a href="/about.html" class="mobile-menu-item">About</a>
                    <a href="/learn.html" class="mobile-menu-item">Learn</a>
                    <a href="/contact.html" class="mobile-menu-item">Contact</a>
                </div>
            </div>
        `;
    }
    
    initializeAuthListener() {
        this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            this.updateAuthUI(user);
        });
    }
    
    updateAuthUI(user) {
        const desktopAuthSection = this.shadowRoot.querySelector('.desktop-menu .auth-section');
        const mobileAuthSection = this.shadowRoot.querySelector('.mobile-auth-section');
        
        if (user) {
            // User is signed in
            const userHtml = `
                <a href="/account.html" class="btn btn-secondary">My Account</a>
                ${user.email === 'admin@vita-tea.com' ? '<a href="/admin/" class="btn btn-secondary">Admin</a>' : ''}
                <button id="logoutBtn" class="btn btn-primary">Sign Out</button>
            `;
            
            const mobileUserHtml = `
                <div class="user-info">
                    <div class="user-email">${user.email}</div>
                    <a href="/account.html" class="btn btn-secondary" style="display: block; text-align: center; margin-bottom: 0.5rem;">My Account</a>
                    ${user.email === 'admin@vita-tea.com' ? '<a href="/admin/" class="btn btn-secondary" style="display: block; text-align: center; margin-bottom: 0.5rem;">Admin Dashboard</a>' : ''}
                    <button id="mobileLogoutBtn" class="btn btn-primary" style="width: 100%;">Sign Out</button>
                </div>
            `;
            
            desktopAuthSection.innerHTML = userHtml;
            mobileAuthSection.innerHTML = mobileUserHtml;
            
            // Add logout functionality
            this.shadowRoot.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
            this.shadowRoot.getElementById('mobileLogoutBtn')?.addEventListener('click', () => this.handleLogout());
            
        } else {
            // User is signed out
            const guestHtml = `
                <a href="/auth.html" class="btn btn-secondary">Sign In</a>
                <a href="/auth.html?mode=register" class="btn btn-primary">Sign Up</a>
            `;
            
            const mobileGuestHtml = `
                <div style="padding: 1rem 0;">
                    <a href="/auth.html" class="btn btn-secondary" style="display: block; text-align: center; margin-bottom: 0.5rem;">Sign In</a>
                    <a href="/auth.html?mode=register" class="btn btn-primary" style="display: block; text-align: center;">Sign Up</a>
                </div>
            `;
            
            desktopAuthSection.innerHTML = guestHtml;
            mobileAuthSection.innerHTML = mobileGuestHtml;
        }
    }
    
    async handleLogout() {
        try {
            await auth.signOut();
            // Update Alpine store
            if (window.Alpine && window.Alpine.store('user')) {
                window.Alpine.store('user').logout();
            }
            // Redirect to home
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    initializeEventListeners() {
        const mobileMenuBtn = this.shadowRoot.getElementById('mobileMenuBtn');
        const mobileMenu = this.shadowRoot.getElementById('mobileMenu');
        
        mobileMenuBtn?.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.contains('open');
            
            if (isOpen) {
                mobileMenu.classList.remove('open');
                mobileMenuBtn.classList.remove('open');
                document.body.style.overflow = '';
            } else {
                mobileMenu.classList.add('open');
                mobileMenuBtn.classList.add('open');
                document.body.style.overflow = 'hidden';
            }
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target) && mobileMenu.classList.contains('open')) {
                mobileMenu.classList.remove('open');
                mobileMenuBtn.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
        
        // Close mobile menu on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && mobileMenu.classList.contains('open')) {
                mobileMenu.classList.remove('open');
                mobileMenuBtn.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
    }
}

// Register the custom element
customElements.define('site-navigation', SiteNavigation);