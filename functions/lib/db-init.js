"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductInventory = updateProductInventory;
exports.createOrderEvent = createOrderEvent;
exports.trackAnalyticsEvent = trackAnalyticsEvent;
exports.cleanupExpiredCarts = cleanupExpiredCarts;
exports.generateOrderNumber = generateOrderNumber;
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
/**
 * Database initialization and utility functions
 */
/**
 * Transaction pattern for inventory updates
 * @param productId - Product ID to update
 * @param quantityChange - Amount to change (negative for decrease)
 * @param changeType - Type of change (order, restock, adjustment)
 * @param referenceId - Related document ID (orderId, etc)
 * @param userId - User performing the action
 */
async function updateProductInventory(productId, quantityChange, changeType, referenceId, userId, note) {
    const db = admin.firestore();
    const productRef = db.collection('products').doc(productId);
    const logRef = db.collection('inventoryLogs').doc();
    return db.runTransaction(async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists) {
            throw new Error('Product not found');
        }
        const currentInventory = productDoc.data().inventory;
        const newInventory = currentInventory + quantityChange;
        if (newInventory < 0) {
            throw new Error('Insufficient inventory');
        }
        // Update product inventory
        transaction.update(productRef, {
            inventory: newInventory,
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        });
        // Create inventory log
        transaction.set(logRef, {
            productId: productId,
            changeType: changeType,
            previousQuantity: currentInventory,
            newQuantity: newInventory,
            changeAmount: quantityChange,
            referenceId: referenceId,
            note: note || null,
            performedBy: userId,
            createdAt: firestore_1.FieldValue.serverTimestamp()
        });
    });
}
/**
 * Create order event for tracking order history
 * @param orderId - Order ID
 * @param eventType - Type of event
 * @param metadata - Additional event data
 * @param performedBy - User or system performing action
 */
async function createOrderEvent(orderId, eventType, metadata, performedBy) {
    const db = admin.firestore();
    await db.collection('orderEvents').add(Object.assign(Object.assign({ orderId,
        eventType }, metadata), { performedBy, createdAt: firestore_1.FieldValue.serverTimestamp() }));
}
/**
 * Track analytics event
 * @param eventType - Type of analytics event
 * @param sessionId - Session identifier
 * @param eventData - Event-specific data
 * @param deviceInfo - Device information
 * @param userId - Optional user ID
 */
async function trackAnalyticsEvent(eventType, sessionId, eventData, deviceInfo, userId) {
    const db = admin.firestore();
    await db.collection('analytics').add({
        eventType,
        sessionId,
        userId: userId || null,
        eventData,
        deviceInfo,
        createdAt: firestore_1.FieldValue.serverTimestamp()
    });
}
/**
 * Clean up expired carts (older than 7 days)
 */
async function cleanupExpiredCarts() {
    const db = admin.firestore();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const expiredCarts = await db.collection('carts')
        .where('updatedAt', '<', sevenDaysAgo)
        .get();
    const batch = db.batch();
    let count = 0;
    expiredCarts.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
    });
    if (count > 0) {
        await batch.commit();
    }
    return count;
}
/**
 * Generate order number in format VT-YYYY-NNNN
 */
async function generateOrderNumber() {
    const db = admin.firestore();
    const year = new Date().getFullYear();
    // Use a counter document to track order numbers
    const counterRef = db.collection('counters').doc('orderNumber');
    const newNumber = await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nextNumber = 1;
        if (counterDoc.exists) {
            const data = counterDoc.data();
            if (data.year === year) {
                nextNumber = data.count + 1;
            }
        }
        transaction.set(counterRef, {
            year: year,
            count: nextNumber,
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        });
        return nextNumber;
    });
    return `VT-${year}-${String(newNumber).padStart(4, '0')}`;
}
//# sourceMappingURL=db-init.js.map