import { Link } from 'react-router-dom';
import { Button } from './Button';

interface FormActionsProps {
  cancelTo: string;
  submitLabel: string;
  isDisabled: boolean;
  isLoading: boolean;
}

/** Footer shared by every form: a way out without saving and the submit button. */
export function FormActions({ cancelTo, submitLabel, isDisabled, isLoading }: FormActionsProps) {
  return (
    <div className="form__actions">
      <Link to={cancelTo} className="button button--ghost">
        Cancelar
      </Link>
      <Button type="submit" variant="primary" disabled={isDisabled} isLoading={isLoading}>
        {submitLabel}
      </Button>
    </div>
  );
}
