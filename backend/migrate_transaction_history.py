"""
Migration script to create transaction_history records for all existing products.
This script creates an initial transaction history entry for each product with:
- amount: product price
- product_id: product ID
- seller_id: product seller ID
- status: "completed"
- transaction_type_sold: False (assuming all existing products are active)
- created_at: current timestamp

Run this script once to populate transaction history for existing products.
"""
import sys
from datetime import datetime
from database import init_firebase, get_db
from config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate_transaction_history():
    """Create transaction history for all existing products"""
    try:
        # Initialize Firebase
        logger.info("Initializing Firebase...")
        init_firebase()
        db = get_db()
        
        # Get all products
        logger.info("Fetching all products...")
        products_ref = db.collection('products')
        products = list(products_ref.stream())
        
        logger.info(f"Found {len(products)} products")
        
        # Counter for tracking
        created_count = 0
        skipped_count = 0
        error_count = 0
        
        for product_doc in products:
            product_id = product_doc.id
            product_data = product_doc.to_dict()
            
            try:
                # Check if transaction history already exists for this product
                existing_history = db.collection('transaction_history').where(
                    'product_id', '==', product_id
                ).where(
                    'transaction_type_sold', 'in', [True, False]
                ).limit(1).get()
                
                if len(list(existing_history)) > 0:
                    logger.info(f"Skipping product {product_id} - transaction history already exists")
                    skipped_count += 1
                    continue
                
                # Create transaction history record
                transaction_history_data = {
                    'amount': product_data.get('price', 0),
                    'product_id': product_id,
                    'seller_id': product_data.get('seller_id', ''),
                    'status': 'completed',
                    'transaction_type_sold': not product_data.get('is_active', True),  # False if active, True if sold
                    'created_at': datetime.now()
                }
                
                db.collection('transaction_history').add(transaction_history_data)
                created_count += 1
                logger.info(f"Created transaction history for product {product_id}")
                
            except Exception as e:
                error_count += 1
                logger.error(f"Error processing product {product_id}: {str(e)}")
                continue
        
        # Summary
        logger.info("=" * 60)
        logger.info("Migration Summary:")
        logger.info(f"Total products: {len(products)}")
        logger.info(f"Transaction histories created: {created_count}")
        logger.info(f"Skipped (already exists): {skipped_count}")
        logger.info(f"Errors: {error_count}")
        logger.info("=" * 60)
        
        return True
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        return False


if __name__ == "__main__":
    logger.info("Starting transaction history migration...")
    success = migrate_transaction_history()
    
    if success:
        logger.info("Migration completed successfully!")
        sys.exit(0)
    else:
        logger.error("Migration failed!")
        sys.exit(1)
