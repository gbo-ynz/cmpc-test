-- Optional publisher country. Additive and nullable: existing rows stay valid, no backfill needed.
ALTER TABLE "publishers" ADD COLUMN "country" VARCHAR(80);
