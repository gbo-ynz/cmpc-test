import type { AuditAction, AuditEntry } from '../../../shared/application/audit-logger.port';
import { REFERENCE_KINDS, type Reference, type ReferenceKind } from '../domain/reference';
import { ReferenceNameTakenError, ReferenceNotFoundError } from '../domain/reference.errors';
import type { ReferenceRepository } from '../domain/reference.repository';

/** Shared steps of the reference commands (create, rename, delete). */
export async function requireReference(
  references: ReferenceRepository,
  kind: ReferenceKind,
  id: string,
): Promise<Reference> {
  const found = await references.findById(kind, id);
  if (!found) throw new ReferenceNotFoundError(kind, id);
  return found;
}

/** The name may stay the same (with different casing) when renaming the record that owns it. */
export async function ensureNameAvailable(
  references: ReferenceRepository,
  kind: ReferenceKind,
  name: string,
  ownerId?: string,
): Promise<void> {
  const existing = await references.findByName(kind, name);
  if (existing && existing.id !== ownerId) throw new ReferenceNameTakenError(name);
}

export function referenceAudit(
  action: AuditAction,
  kind: ReferenceKind,
  reference: Reference,
  actorId: string,
  metadata: Record<string, unknown> = {},
): AuditEntry {
  return {
    action,
    entityType: REFERENCE_KINDS[kind].entityType,
    entityId: reference.id,
    actorId,
    metadata: { name: reference.name, ...metadata },
  };
}
