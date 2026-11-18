import { IconButton } from '../../../shared/ui/IconButton';
import { CheckIcon, CloseIcon, PencilIcon } from '../../../shared/ui/icons';
import type { Reference, ReferenceKind } from '../domain/reference.types';
import { DeleteReferenceButton } from './DeleteReferenceButton';

interface ReferenceRowActionsProps {
  kind: ReferenceKind;
  reference: Reference;
  isEditing: boolean;
  canSave: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

/** Rename / delete while viewing; save / cancel while renaming. */
export function ReferenceRowActions(props: ReferenceRowActionsProps) {
  const { kind, reference, isEditing, canSave, isSaving, onEdit, onSave, onCancel } = props;

  if (!isEditing) {
    return (
      <div className="icon-group">
        <IconButton label={`Renombrar ${reference.name}`} onClick={onEdit}>
          <PencilIcon />
        </IconButton>
        <DeleteReferenceButton kind={kind} reference={reference} />
      </div>
    );
  }
  return (
    <div className="icon-group">
      <IconButton label="Guardar" tone="primary" onClick={onSave} disabled={!canSave || isSaving}>
        <CheckIcon />
      </IconButton>
      <IconButton label="Cancelar" onClick={onCancel}>
        <CloseIcon />
      </IconButton>
    </div>
  );
}
