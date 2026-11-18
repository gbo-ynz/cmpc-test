interface SpinnerProps {
  label?: string;
  size?: 'sm' | 'md';
}

export function Spinner({ label = 'Cargando', size = 'md' }: SpinnerProps) {
  return <span className={`spinner spinner--${size}`} role="status" aria-label={label} />;
}
