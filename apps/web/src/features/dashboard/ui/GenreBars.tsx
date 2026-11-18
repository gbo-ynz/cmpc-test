import type { GenreBookCount } from '../domain/dashboard.types';

/** Active books per genre; the bar is relative to the genre with the most books. */
export function GenreBars({ genres }: { genres: readonly GenreBookCount[] }) {
  const most = Math.max(...genres.map((genre) => genre.books), 1);
  return (
    <section aria-labelledby="dashboard-genres">
      <h2 id="dashboard-genres">Libros por género</h2>
      <ul className="genre-bars card">
        {genres.map(({ genre, books }) => (
          <li key={genre}>
            <span className="genre-bars__name">{genre}</span>
            <span className="genre-bars__track" aria-hidden="true">
              <span className="genre-bars__fill" style={{ width: `${(books / most) * 100}%` }} />
            </span>
            <span className="genre-bars__count">{books}</span>
          </li>
        ))}
      </ul>
      {genres.length === 0 ? <p className="muted">Todavía no hay géneros.</p> : null}
    </section>
  );
}
