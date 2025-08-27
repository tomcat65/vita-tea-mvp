/**
 * Home Page Controller
 * Manages homepage-specific functionality including hero animations,
 * lazy loading, and tracking interactions
 */

import { analyticsService } from './services/analytics.service.js';

// Initialize homepage functionality
document.addEventListener('DOMContentLoaded', () => {
    // Track page view
    analyticsService.trackPageView('homepage', {
        referrer: document.referrer,
        viewport: `${window.innerWidth}x${window.innerHeight}`
    });
    
    // Initialize hero parallax effect
    initHeroParallax();
    
    // Initialize CTA tracking
    initCTATracking();
    
    // Initialize newsletter form
    initNewsletterForm();
});

/**
 * Hero section parallax scrolling effect
 */
function initHeroParallax() {
    const heroImage = document.querySelector('.hero-overlay')?.parentElement;
    if (!heroImage) {
        return;
    }
    
    let ticking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const speed = 0.5;
        
        heroImage.style.transform = `translateY(${scrolled * speed}px)`;
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    // Only apply parallax on desktop
    if (window.innerWidth > 768) {
        window.addEventListener('scroll', requestTick);
    }
}

/**
 * Track CTA button clicks
 */
function initCTATracking() {
    // Track all CTA clicks
    document.querySelectorAll('a.btn-primary, a.btn-secondary, button.btn-primary, button.btn-secondary').forEach(cta => {
        cta.addEventListener('click', (e) => {
            const ctaText = e.currentTarget.textContent.trim();
            const ctaLocation = getCtaLocation(e.currentTarget);
            const destination = e.currentTarget.href || 'button-action';
            
            analyticsService.trackEvent('cta_click', {
                cta_text: ctaText,
                cta_location: ctaLocation,
                destination: destination,
                cta_type: e.currentTarget.classList.contains('btn-primary') ? 'primary' : 'secondary'
            });
        });
    });
    
    // Track category card clicks
    document.querySelectorAll('a[href*="shop.html?filter"]').forEach(card => {
        card.addEventListener('click', (e) => {
            const filterType = new URL(e.currentTarget.href).searchParams.get('filter');
            
            analyticsService.trackEvent('category_click', {
                category: filterType,
                location: 'homepage_cards'
            });
        });
    });
}

/**
 * Determine CTA location based on DOM position
 */
function getCtaLocation(element) {
    // Check if in hero section
    if (element.closest('section')?.querySelector('.hero-overlay')) {
        return 'hero';
    }
    
    // Check if in sample trio section
    if (element.closest('section')?.textContent.includes('Sample Trio')) {
        return 'sample_trio';
    }
    
    // Check if in final CTA section
    if (element.closest('section')?.classList.contains('bg-green-900')) {
        return 'final_cta';
    }
    
    // Check if in dual entry section
    if (element.closest('section')?.textContent.includes('Choose Your Path')) {
        return 'dual_entry';
    }
    
    return 'other';
}

/**
 * Initialize newsletter subscription form
 */
function initNewsletterForm() {
    const form = document.querySelector('footer form');
    if (!form) {
        return;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = form.querySelector('input[type="email"]');
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // Basic email validation
        const email = emailInput.value.trim();
        if (!email || !email.includes('@')) {
            emailInput.classList.add('border-red-500');
            return;
        }
        
        // Update UI to loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Subscribing...';
        emailInput.classList.remove('border-red-500');
        
        try {
            // Track subscription attempt
            analyticsService.trackEvent('newsletter_subscribe', {
                location: 'footer',
                email_domain: email.split('@')[1]
            });
            
            // Simulate subscription (would normally call backend)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Success state
            submitButton.textContent = 'Subscribed!';
            submitButton.classList.add('bg-green-600');
            emailInput.value = '';
            
            // Reset after delay
            setTimeout(() => {
                submitButton.textContent = originalButtonText;
                submitButton.classList.remove('bg-green-600');
                submitButton.disabled = false;
            }, 3000);
            
        } catch (error) {
            // Newsletter subscription error
            submitButton.textContent = 'Error - Try Again';
            submitButton.disabled = false;
            
            setTimeout(() => {
                submitButton.textContent = originalButtonText;
            }, 3000);
        }
    });
}

// Initialize intersection observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            
            // Track section views for engagement metrics
            const sectionName = entry.target.querySelector('h2')?.textContent || 'unknown';
            analyticsService.trackEvent('section_view', {
                section: sectionName,
                time_on_page: Math.round((Date.now() - window.pageLoadTime) / 1000)
            });
        }
    });
}, observerOptions);

// Observe all major sections
document.querySelectorAll('section').forEach(section => {
    if (section.querySelector('h2')) {
        scrollObserver.observe(section);
    }
});

// Track time on page
window.pageLoadTime = Date.now();
window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - window.pageLoadTime) / 1000);
    analyticsService.trackEvent('page_exit', {
        page: 'homepage',
        time_on_page: timeOnPage,
        scroll_depth: Math.round((window.scrollY / document.body.scrollHeight) * 100)
    });
});