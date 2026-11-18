export function AvailabilityBadge({ isAvailable }: { isAvailable: boolean }) {
  return (
    <span className={`badge badge--${isAvailable ? 'success' : 'muted'}`}>
      {isAvailable ? 'Disponible' : 'No disponible'}
    </span>
  );
}
