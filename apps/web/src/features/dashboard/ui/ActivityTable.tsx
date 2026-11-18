import { formatDateTime } from '../../../shared/lib/format';
import { describeActivity } from '../domain/activity-labels';
import type { ActivityEntry } from '../domain/dashboard.types';

/** The last audit operations: who did what, to which record, and when. */
export function ActivityTable({ entries }: { entries: readonly ActivityEntry[] }) {
  if (entries.length === 0) return <p className="muted">Todavía no hay operaciones registradas.</p>;
  return (
    <div className="table-wrapper card">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Operación</th>
            <th scope="col">Usuario</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={`${entry.createdAt}-${entry.action}-${entry.label}`}>
              <td>{formatDateTime(entry.createdAt)}</td>
              <td>
                {describeActivity(entry.action, entry.entityType)}
                {entry.label ? <strong> {entry.label}</strong> : null}
              </td>
              <td>{entry.actorName ?? <span className="muted">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
