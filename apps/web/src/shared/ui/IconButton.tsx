import type { ComponentPropsWithoutRef, ReactNode } from 'react';

interface IconButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'aria-label'> {
  /** Accessible name and tooltip: an icon alone says nothing to a screen reader. */
  label: string;
  tone?: 'default' | 'danger' | 'primary';
  children: ReactNode;
}

export function IconButton({ label, tone = 'default', children, ...buttonProps }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`icon-button icon-button--${tone}`}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
