-- Among ACTIVE books, the title (ignoring case), the author and the publisher identify a book.

-- 1. Canonical titles: trimmed, with inner runs of whitespace collapsed (the domain stores them so too).
UPDATE "books"
SET "title" = regexp_replace(btrim("title"), '\s+', ' ', 'g')
WHERE "title" <> regexp_replace(btrim("title"), '\s+', ' ', 'g');

-- 2. Never pick silently which duplicate survives: stop and let an operator soft delete the extras.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "books"
    WHERE "deleted_at" IS NULL
    GROUP BY lower("title"), "author_id", "publisher_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate active books (same title, author and publisher): soft delete the extra copies and apply this migration again';
  END IF;
END $$;

-- 3. Partial expression index: a soft-deleted book never blocks loading it again.
CREATE UNIQUE INDEX "books_active_identity_key"
  ON "books" (lower("title"), "author_id", "publisher_id")
  WHERE "deleted_at" IS NULL;
