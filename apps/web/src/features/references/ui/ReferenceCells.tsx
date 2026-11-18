/** Name with its initial: easier to scan a long alphabetical list. */
export function ReferenceName({ name }: { name: string }) {
  return (
    <span className="reference-name">
      <span className="reference-avatar" aria-hidden="true">
        {name.charAt(0).toUpperCase()}
      </span>
      {name}
    </span>
  );
}

/** Active books as a pill: muted when zero (the record can then be deleted). */
export function ActiveBooksPill({ count }: { count: number }) {
  return <span className={`count-pill${count === 0 ? ' count-pill--empty' : ''}`}>{count}</span>;
}
