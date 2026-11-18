-- Optional author details. Additive and nullable: existing rows stay valid, no backfill needed.
ALTER TABLE "authors" ADD COLUMN "birth_date" DATE;
ALTER TABLE "authors" ADD COLUMN "biography" VARCHAR(1000);
