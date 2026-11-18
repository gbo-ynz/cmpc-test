-- Optional genre description. Additive and nullable: existing rows stay valid, no backfill needed.
ALTER TABLE "genres" ADD COLUMN "description" VARCHAR(500);
