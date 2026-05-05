# Transaction History Migration Guide

## Overview

This guide explains the transaction history feature and how to migrate existing products.

## What is Transaction History?

Transaction history tracks when products are marked as sold or active. Each time a seller changes the status of their product, a record is created with:

- `amount`: Product price (double)
- `product_id`: Product ID (string)
- `seller_id`: Seller's user ID (string)
- `status`: Always "completed" (string)
- `transaction_type_sold`: true when marked as sold, false when marked as active (boolean)
- `created_at`: Timestamp of the status change

## How It Works

### When Seller Marks Product as Sold
1. Product `is_active` is set to `false`
2. A transaction history record is created with `transaction_type_sold: true`
3. If a buyer is specified, additional transaction records are created for both buyer and seller

### When Seller Marks Product as Active
1. Product `is_active` is set to `true`
2. A transaction history record is created with `transaction_type_sold: false`

## Migration for Existing Products

To create transaction history for all existing products, run the migration script:

```bash
cd backend
python migrate_transaction_history.py
```

### What the Migration Does

1. Fetches all products from the database
2. For each product without transaction history:
   - Creates a transaction history record
   - Sets `transaction_type_sold` based on product's `is_active` status
   - Uses current timestamp as `created_at`
3. Skips products that already have transaction history
4. Provides a summary of created, skipped, and error records

### Migration Output

```
Starting transaction history migration...
Initializing Firebase...
Fetching all products...
Found 150 products
Created transaction history for product ABC123
Created transaction history for product DEF456
...
============================================================
Migration Summary:
Total products: 150
Transaction histories created: 145
Skipped (already exists): 5
Errors: 0
============================================================
Migration completed successfully!
```

## API Endpoints

### Get Transaction History
```
GET /api/transactions/history
```
Query parameters:
- `product_id` (optional): Filter by product
- `transaction_type_sold` (optional): Filter by sold status (true/false)
- `limit` (optional): Number of records (default: 50, max: 200)

### Get Transaction Statistics
```
GET /api/transactions/stats
```
Query parameters:
- `days` (optional): Number of days to analyze (default: 30, max: 365)

Returns:
- `total_sold`: Number of products marked as sold
- `total_active`: Number of products marked as active
- `total_revenue`: Sum of amounts for sold products
- `total_transactions`: Total transaction count

### Get Product Transaction History
```
GET /api/transactions/product/{product_id}
```
Returns all transaction history records for a specific product (seller only).

## Database Schema

### Collection: `transaction_history`

```javascript
{
  id: "auto-generated",
  amount: 80000.0,
  product_id: "WXU9SMOMYVKkOjsGdb68",
  seller_id: "tCEhIEKb3VNs9dv4XKT8OWdteFE3",
  status: "completed",
  transaction_type_sold: true,
  created_at: Timestamp("April 11, 2026 at 6:12:00 PM UTC+5:30")
}
```

## Testing

After migration, verify the data:

1. Check transaction history count:
   ```bash
   # In Firebase Console, go to Firestore
   # Navigate to transaction_history collection
   # Verify records exist
   ```

2. Test API endpoints:
   ```bash
   # Get your transaction history
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/transactions/history

   # Get statistics
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/transactions/stats
   ```

3. Test mark as sold/active:
   - Mark a product as sold in the UI
   - Check that a new transaction history record is created with `transaction_type_sold: true`
   - Mark the same product as active
   - Check that a new transaction history record is created with `transaction_type_sold: false`

## Troubleshooting

### Migration fails with "Firebase not initialized"
Make sure your `.env` file has all required Firebase credentials.

### Migration creates duplicate records
The script checks for existing records before creating new ones. If you see duplicates, there may be an issue with the query. Check the Firestore indexes.

### API returns 500 error
Check the backend logs for detailed error messages. Common issues:
- Missing Firestore indexes (create them in Firebase Console)
- Invalid authentication token
- Database connection issues

## Notes

- Transaction history is created automatically for all future status changes
- The migration script is idempotent (safe to run multiple times)
- Only sellers can view their own transaction history
- Transaction history records are never deleted, only created
