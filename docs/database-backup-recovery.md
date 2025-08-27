# Firestore Database Backup and Recovery Procedures

## Overview

This document outlines the backup and recovery procedures for the Vita Tea MVP Firestore database. Firebase provides automatic backups and several recovery options to ensure data integrity and availability.

## Automatic Backup Features

### 1. Built-in Data Durability
- **Multi-region replication**: Firestore automatically replicates data across multiple data centers
- **Point-in-time recovery**: Firebase maintains automatic backups with 1-minute granularity
- **99.999% availability SLA**: Enterprise-grade reliability for production applications

### 2. Daily Automatic Backups (Firebase Console)
- Navigate to: Firebase Console > Firestore > Backups
- Automatic daily backups are enabled by default for production projects
- Retention period: 7 days (configurable up to 365 days in paid plans)

## Manual Backup Procedures

### 1. Export Data via Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Export all collections
firebase firestore:export gs://vita-tea-backups/backup-$(date +%Y%m%d-%H%M%S)

# Export specific collections
firebase firestore:export gs://vita-tea-backups/backup-$(date +%Y%m%d-%H%M%S) \
  --collection-ids=users,products,orders
```

### 2. Scheduled Exports via Cloud Functions

Create a Cloud Function for automated backups:

```javascript
// functions/src/scheduled-backup.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const scheduledFirestoreBackup = functions.pubsub
  .schedule('0 2 * * *') // Daily at 2 AM
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const bucket = `gs://${projectId}-backups`;
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const path = `${bucket}/scheduled-backup-${timestamp}`;

    const client = new admin.firestore.v1.FirestoreAdminClient();
    
    await client.exportDocuments({
      name: client.databasePath(projectId!, '(default)'),
      outputUriPrefix: path,
      collectionIds: [] // Empty array exports all collections
    });

    console.log(`Backup completed to: ${path}`);
  });
```

## Recovery Procedures

### 1. Restore from Automatic Backups (Console)
1. Go to Firebase Console > Firestore > Backups
2. Select the backup timestamp you want to restore
3. Click "Restore" and choose restore options:
   - Restore to new database
   - Restore to existing database (overwrites data)
4. Confirm the restoration

### 2. Import from Manual Backup

```bash
# List available backups
gsutil ls gs://vita-tea-backups/

# Import entire backup
firebase firestore:import gs://vita-tea-backups/backup-20240827-143000

# Import specific collections only
firebase firestore:import gs://vita-tea-backups/backup-20240827-143000 \
  --collection-ids=products,orders
```

### 3. Point-in-Time Recovery
For critical data recovery needs:
1. Contact Firebase Support
2. Provide:
   - Project ID
   - Exact timestamp for recovery
   - Affected collections
3. Recovery available for up to 7 days in the past

## Transaction Patterns for Data Consistency

### Inventory Update Pattern
```typescript
// See functions/src/db-init.ts:updateProductInventory
// Ensures atomic updates of inventory and audit logs
```

### Order Processing Pattern
```typescript
async function processOrder(orderId: string): Promise<void> {
  const db = admin.firestore();
  
  return db.runTransaction(async (transaction) => {
    // 1. Read order and all products
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await transaction.get(orderRef);
    const order = orderDoc.data();
    
    // 2. Verify inventory for all items
    for (const item of order.items) {
      const productRef = db.collection('products').doc(item.productId);
      const productDoc = await transaction.get(productRef);
      
      if (productDoc.data().inventory < item.quantity) {
        throw new Error(`Insufficient inventory for ${item.productId}`);
      }
    }
    
    // 3. Update inventory and create logs atomically
    for (const item of order.items) {
      // Update product inventory
      const productRef = db.collection('products').doc(item.productId);
      transaction.update(productRef, {
        inventory: admin.firestore.FieldValue.increment(-item.quantity)
      });
      
      // Create inventory log
      const logRef = db.collection('inventoryLogs').doc();
      transaction.set(logRef, {
        productId: item.productId,
        changeType: 'order',
        changeAmount: -item.quantity,
        referenceId: orderId,
        performedBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // 4. Update order status
    transaction.update(orderRef, {
      status: 'processing',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
}
```

## Inventory Reconciliation Procedure

### Daily Reconciliation Check
```javascript
export async function reconcileInventory(): Promise<void> {
  const db = admin.firestore();
  const products = await db.collection('products').get();
  
  for (const productDoc of products.docs) {
    const productId = productDoc.id;
    const recordedInventory = productDoc.data().inventory;
    
    // Calculate actual inventory from logs
    const logs = await db.collection('inventoryLogs')
      .where('productId', '==', productId)
      .orderBy('createdAt', 'asc')
      .get();
    
    let calculatedInventory = 0;
    logs.forEach(log => {
      calculatedInventory += log.data().changeAmount;
    });
    
    // Check for discrepancies
    if (recordedInventory !== calculatedInventory) {
      console.error(`Inventory mismatch for ${productId}:`, {
        recorded: recordedInventory,
        calculated: calculatedInventory,
        difference: recordedInventory - calculatedInventory
      });
      
      // Create reconciliation log
      await db.collection('inventoryLogs').add({
        productId: productId,
        changeType: 'adjustment',
        previousQuantity: calculatedInventory,
        newQuantity: recordedInventory,
        changeAmount: recordedInventory - calculatedInventory,
        note: 'Reconciliation adjustment',
        performedBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
}
```

## Cart Expiration and Cleanup Process

### Automated Cart Cleanup
```javascript
// See functions/src/db-init.ts:cleanupExpiredCarts
// Runs daily to remove carts older than 7 days

export const scheduledCartCleanup = functions.pubsub
  .schedule('0 3 * * *') // Daily at 3 AM
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    const count = await cleanupExpiredCarts();
    console.log(`Cleaned up ${count} expired carts`);
  });
```

### Manual Cart Recovery
For recently expired carts (within backup retention):
1. Identify the user and approximate cart creation date
2. Restore from daily backup to temporary collection
3. Extract specific cart data
4. Manually recreate cart if needed

## Monitoring and Alerts

### Set up Stackdriver Alerts for:
1. **Backup Failures**
   - Alert when scheduled backup function fails
   - Alert when export operation returns error

2. **Data Anomalies**
   - Sudden drop in collection document count
   - Unusual number of delete operations
   - Failed transactions above threshold

3. **Inventory Discrepancies**
   - Alert when reconciliation finds mismatches
   - Alert on negative inventory values

### Alert Configuration Example:
```yaml
# monitoring/backup-failure-alert.yaml
alertPolicy:
  displayName: "Firestore Backup Failure"
  conditions:
    - displayName: "Backup function error rate"
      conditionThreshold:
        filter: |
          resource.type="cloud_function"
          resource.labels.function_name="scheduledFirestoreBackup"
          severity>="ERROR"
        comparison: COMPARISON_GT
        thresholdValue: 0
  notificationChannels:
    - projects/vita-tea-mvp/notificationChannels/[CHANNEL_ID]
```

## Best Practices

1. **Regular Testing**
   - Perform monthly restore tests from backups
   - Verify data integrity after each restore
   - Document restoration times for planning

2. **Access Control**
   - Limit backup/restore permissions to admin roles only
   - Use service accounts for automated processes
   - Enable audit logging for all backup operations

3. **Documentation**
   - Keep backup logs with timestamps and sizes
   - Document any data corrections or reconciliations
   - Maintain restoration procedure runbooks

4. **Cost Management**
   - Monitor Cloud Storage costs for backups
   - Implement retention policies (e.g., daily for 7 days, weekly for 4 weeks)
   - Compress older backups if needed

## Emergency Contacts

- **Firebase Support**: https://firebase.google.com/support
- **Project Owner**: [Update with actual contact]
- **Database Administrator**: [Update with actual contact]

## Revision History

| Date | Version | Author | Description |
|------|---------|--------|-------------|
| 2025-08-27 | 1.0 | Dev Agent | Initial documentation |