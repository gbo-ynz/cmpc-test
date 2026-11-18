import type { AdministrationDashboard } from '../domain/dashboard.types';
import { ActivityTable } from './ActivityTable';
import { StatCard } from './StatCard';

/** Administrators only: the counters of what they manage and the latest audit trail. */
export function AdministrationSection({ data }: { data: AdministrationDashboard }) {
  const { catalog } = data;
  return (
    <>
      <section aria-labelledby="dashboard-administration">
        <h2 id="dashboard-administration">Administración</h2>
        <dl className="stat-grid">
          <StatCard label="Autores" value={catalog.authors} to="/authors" />
          <StatCard label="Editoriales" value={catalog.publishers} to="/publishers" />
          <StatCard label="Géneros" value={catalog.genres} to="/genres" />
          <StatCard label="Usuarios" value={catalog.users} to="/users" />
        </dl>
      </section>
      <section aria-labelledby="dashboard-activity">
        <h2 id="dashboard-activity">Actividad reciente</h2>
        <ActivityTable entries={data.recentActivity} />
      </section>
    </>
  );
}
