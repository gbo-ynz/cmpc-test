-- Failed sign-ins are part of the audit trail (brute force, stolen credentials).
-- Additive only: existing rows and every other value of the enum are untouched.
ALTER TYPE "AuditAction" ADD VALUE 'LOGIN_FAILED';
