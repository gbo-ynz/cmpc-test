-- The audit trail is evidence: rows are only ever added. The application never edits or deletes
-- them, and this trigger makes the database refuse it too (a bug, a console session or a
-- compromised account cannot rewrite history).
--
-- The one change allowed is the one the foreign key makes by itself: when a user row is deleted,
-- ON DELETE SET NULL detaches the author (user_id -> NULL) and leaves everything else untouched.
-- TRUNCATE is deliberately not covered: it stays available for test databases and a controlled reset.
CREATE FUNCTION audit_logs_reject_changes() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.user_id IS NULL
     AND ROW(NEW.id, NEW.action, NEW.entity_type, NEW.entity_id, NEW.metadata, NEW.created_at)
         IS NOT DISTINCT FROM
         ROW(OLD.id, OLD.action, OLD.entity_type, OLD.entity_id, OLD.metadata, OLD.created_at)
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'audit_logs is append-only (% rejected)', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION audit_logs_reject_changes();
