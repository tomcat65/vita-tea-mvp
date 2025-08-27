/**
 * Analytics service for tracking user interactions
 * Handles all analytics events and reporting
 * Uses Cloud Function endpoint for secure analytics writes
 */

import { firebaseReady } from '../firebase-config.js';

class AnalyticsService {
    constructor() {
        this.functionsUrl = null;
        this.ready = false;
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.eventQueue = [];
        this.batchSize = 10;
        this.flushInterval = 5000; // 5 seconds
    }

    /**
     * Initialize the analytics service
     * @returns {Promise<void>}
     */
    async init() {
        await firebaseReady;
        
        // Determine the Cloud Functions URL based on environment
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // Use emulator in development
            this.functionsUrl = 'http://localhost:5001/vida-tea/us-central1/trackAnalytics';
        } else {
            // Use production URL
            this.functionsUrl = 'https://us-central1-vida-tea.cloudfunctions.net/trackAnalytics';
        }
        
        this.ready = true;

        // Start batch processing
        this.startBatchProcessing();

        // Flush events on page unload
        window.addEventListener('beforeunload', () => {
            this.flush();
        });

        // Track session start
        this.trackEvent('session_start', {
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language
        });
    }

    /**
     * Generate a unique session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Set the current user ID
     * @param {string} userId - User ID to set
     */
    setUserId(userId) {
        this.userId = userId;
    }

    /**
     * Track a page view
     * @param {string} pagePath - Page path or name
     * @param {Object} additionalData - Additional data to track
     * @returns {void}
     */
    trackPageView(pagePath, additionalData = {}) {
        this.trackEvent('page_view', {
            page_path: pagePath,
            page_location: window.location.href,
            page_title: document.title,
            ...additionalData
        });
    }

    /**
     * Track a custom event
     * @param {string} eventName - Name of the event
     * @param {Object} eventData - Event data
     * @returns {void}
     */
    trackEvent(eventName, eventData = {}) {
        if (!this.ready) {
            this.init().then(() => this.trackEvent(eventName, eventData));
            return;
        }

        const event = {
            eventName,
            eventData: {
                ...eventData,
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                userId: this.userId,
                pageUrl: window.location.href,
                pageTitle: document.title
            }
        };

        this.eventQueue.push(event);

        // Flush if queue is full
        if (this.eventQueue.length >= this.batchSize) {
            this.flush();
        }
    }

    /**
     * Track an error
     * @param {string} errorType - Type of error
     * @param {Error|Object} error - Error object
     * @returns {void}
     */
    trackError(errorType, error) {
        this.trackEvent('error', {
            error_type: errorType,
            error_message: error.message || String(error),
            error_stack: error.stack || '',
            error_name: error.name || 'Unknown'
        });
    }

    /**
     * Track ecommerce events
     * @param {string} action - Ecommerce action (view_item, add_to_cart, etc)
     * @param {Object} itemData - Item data
     * @returns {void}
     */
    trackEcommerce(action, itemData) {
        this.trackEvent(`ecommerce_${action}`, itemData);
    }

    /**
     * Start batch processing of events
     * @returns {void}
     */
    startBatchProcessing() {
        setInterval(() => {
            if (this.eventQueue.length > 0) {
                this.flush();
            }
        }, this.flushInterval);
    }

    /**
     * Flush event queue to Cloud Function
     * @returns {Promise<void>}
     */
    async flush() {
        if (this.eventQueue.length === 0 || !this.ready) {
            return;
        }

        const eventsToSend = [...this.eventQueue];
        this.eventQueue = [];

        try {
            // Send events to Cloud Function
            const response = await fetch(this.functionsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ events: eventsToSend })
            });

            if (!response.ok) {
                throw new Error(`Analytics request failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('Analytics tracked:', result.message);
        } catch (error) {
            console.error('Failed to send analytics events:', error);
            // Re-add events to queue on failure
            this.eventQueue = [...eventsToSend, ...this.eventQueue];
        }
    }

    /**
     * Track timing events (e.g., page load time)
     * @param {string} category - Timing category
     * @param {string} variable - Timing variable
     * @param {number} value - Time in milliseconds
     * @returns {void}
     */
    trackTiming(category, variable, value) {
        this.trackEvent('timing', {
            timing_category: category,
            timing_variable: variable,
            timing_value: value
        });
    }

    /**
     * Track social interactions
     * @param {string} network - Social network
     * @param {string} action - Social action (share, like, etc)
     * @param {string} target - Target URL or content
     * @returns {void}
     */
    trackSocial(network, action, target) {
        this.trackEvent('social_interaction', {
            social_network: network,
            social_action: action,
            social_target: target
        });
    }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Initialize automatically
analyticsService.init().catch(console.error);