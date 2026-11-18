import { useEffect, useRef } from 'react';

interface SuccessBannerProps {
  message: string;
}

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Polite live region (announced without interrupting). It scrolls itself into view because the
 * action that triggers it usually sits at the bottom of a long form, far from the banner.
 */
export function SuccessBanner({ message }: SuccessBannerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, []);

  return (
    <div ref={ref} role="status" className="alert alert--success">
      {message}
    </div>
  );
}
