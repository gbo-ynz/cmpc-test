import { toApiError } from '../api/api-error';

interface ErrorBannerProps {
  error: unknown;
  title?: string;
}

export function ErrorBanner({ error, title = 'Algo salió mal' }: ErrorBannerProps) {
  const { message, details } = toApiError(error);

  return (
    <div role="alert" className="alert alert--error">
      <strong>{title}</strong>
      <p>{message}</p>
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
