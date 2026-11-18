-- Expand phase (docs/DATABASE.md, "expandir → migrar → contraer"): additive changes only.
-- books.is_available keeps working until a later migration drops it in favour of stock > 0.

-- Roles: EDITOR becomes USER. RENAME VALUE keeps every existing row (drop/create would lose them).
ALTER TYPE "UserRole" RENAME VALUE 'EDITOR' TO 'USER';
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';

-- Users are deactivated, never deleted: audit_logs keep pointing to their author.
ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMPTZ(3);

-- Audit actions for the sale lifecycle.
ALTER TYPE "AuditAction" ADD VALUE 'COMPLETE';
ALTER TYPE "AuditAction" ADD VALUE 'CANCEL';

CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'TRANSFER');

-- Stock: backfilled from the manual availability flag (available = 1 unit, otherwise 0).
ALTER TABLE "books" ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 0;
UPDATE "books" SET "stock" = CASE WHEN "is_available" THEN 1 ELSE 0 END;
ALTER TABLE "books" ADD CONSTRAINT "books_stock_non_negative" CHECK ("stock" >= 0);
CREATE INDEX "books_deleted_at_stock_idx" ON "books"("deleted_at", "stock");

CREATE TABLE "sales" (
    "id" UUID NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "PaymentMethod",
    "total" DECIMAL(12,2) NOT NULL,
    "created_by_id" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sales_total_non_negative" CHECK ("total" >= 0),
    -- Completed <=> has a payment method and a completion date; cancelled <=> has a cancellation date.
    CONSTRAINT "sales_completion_consistent"
        CHECK (("status" = 'COMPLETED') = ("payment_method" IS NOT NULL AND "completed_at" IS NOT NULL)),
    CONSTRAINT "sales_cancellation_consistent"
        CHECK (("status" = 'CANCELLED') = ("cancelled_at" IS NOT NULL))
);

CREATE TABLE "sale_items" (
    "id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sale_items_quantity_positive" CHECK ("quantity" > 0)
);

CREATE INDEX "sales_status_created_at_idx" ON "sales"("status", "created_at");
CREATE INDEX "sales_created_at_idx" ON "sales"("created_at");
CREATE INDEX "sale_items_book_id_idx" ON "sale_items"("book_id");
CREATE UNIQUE INDEX "sale_items_sale_id_book_id_key" ON "sale_items"("sale_id", "book_id");

ALTER TABLE "sales" ADD CONSTRAINT "sales_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey"
    FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_book_id_fkey"
    FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
