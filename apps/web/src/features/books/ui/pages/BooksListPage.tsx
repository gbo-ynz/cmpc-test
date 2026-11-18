import { Link } from 'react-router-dom';
import { ErrorBanner } from '../../../../shared/ui/ErrorBanner';
import { Pagination } from '../../../../shared/ui/Pagination';
import { useBookList } from '../../application/book-queries';
import { useBookListState } from '../../application/useBookListState';
import { BookFiltersBar } from '../components/BookFiltersBar';
import { BooksTable } from '../components/BooksTable';
import { ExportCsvButton } from '../components/ExportCsvButton';

export function BooksListPage() {
  const state = useBookListState();
  const { data, error, isPending, isFetching } = useBookList(state.params);

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1>Inventario de libros</h1>
          <p className="muted">
            {data
              ? `${data.meta.total} ${data.meta.total === 1 ? 'libro' : 'libros'}`
              : 'Cargando…'}
          </p>
        </div>
        <div className="page__actions">
          <ExportCsvButton filters={state.params.filters} sort={state.sort} />
          <Link to="/books/new" className="button button--primary">
            Nuevo libro
          </Link>
        </div>
      </header>
      <BookFiltersBar filters={state.filters} onChange={state.updateFilter} onReset={state.reset} />
      {error ? <ErrorBanner error={error} title="No se pudieron cargar los libros" /> : null}
      <BooksTable
        books={data?.items ?? []}
        sort={state.sort}
        onSort={state.toggleSort}
        isLoading={isPending}
        isRefreshing={isFetching && !isPending}
      />
      {data && data.meta.total > 0 ? (
        <Pagination meta={data.meta} onPageChange={state.setPage} onLimitChange={state.setLimit} />
      ) : null}
    </section>
  );
}
