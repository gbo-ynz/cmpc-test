-- Contract phase (docs/DATABASE.md, "expandir → migrar → contraer"): no code reads is_available anymore.
-- Availability is derived from stock (stock > 0), backfilled by 20261118000000_roles_stock_sales_expand.
DROP INDEX "books_deleted_at_is_available_idx";
ALTER TABLE "books" DROP COLUMN "is_available";
