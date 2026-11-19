import { toApiError } from '../api/api-error';

interface ErrorBannerProps {
  error: unknown;
  title?: string;
  /** Screen-specific wording; otherwise the message mapped from the error code. */
  message?: string;
}

export function ErrorBanner({ error, title = 'Algo salió mal', message }: ErrorBannerProps) {
  const apiError = toApiError(error);
  const { details } = apiError;

  return (
    <div role="alert" className="alert alert--error">
      <strong>{title}</strong>
      <p>{message ?? apiError.message}</p>
      {details.length > 0 ? (
        <ul>
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
