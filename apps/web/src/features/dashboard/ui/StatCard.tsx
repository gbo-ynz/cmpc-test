import { Link } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: string | number;
  /** When present the whole card links there (the label is the real link, stretched by CSS). */
  to?: string;
}

/** One figure: the label comes first for screen readers, the value is drawn bigger above it. */
export function StatCard({ label, value, to }: StatCardProps) {
  return (
    <div className={`stat-card card${to ? ' stat-card--link' : ''}`}>
      <dt className="stat-card__label">{to ? <Link to={to}>{label}</Link> : label}</dt>
      <dd className="stat-card__value">{value}</dd>
    </div>
  );
}
