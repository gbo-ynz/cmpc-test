import { useEffect, useId, useState, type ChangeEvent } from 'react';
import { ACCEPTED_IMAGE_TYPES, validateImage } from '../../domain/book-form.schema';

interface ImagePickerProps {
  currentUrl: string | null;
  onChange: (file: File | null) => void;
}

export function ImagePicker({ currentUrl, onChange }: ImagePickerProps) {
  const labelId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Free the previous object URL whenever the preview changes or unmounts.
  useEffect(() => () => (previewUrl ? URL.revokeObjectURL(previewUrl) : undefined), [previewUrl]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const validationError = file ? validateImage(file) : null;
    const accepted = file && !validationError ? file : null;
    setError(validationError);
    setPreviewUrl(accepted ? URL.createObjectURL(accepted) : null);
    onChange(accepted);
  };

  const shownUrl = previewUrl ?? currentUrl;

  return (
    <div className="field image-picker">
      <span className="field__label" id={labelId}>
        Imagen de portada
      </span>
      {shownUrl ? (
        <img src={shownUrl} alt="Vista previa de la portada" className="image-picker__preview" />
      ) : (
        <div className="cover-placeholder cover-placeholder--lg" aria-hidden="true" />
      )}
      <input
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        aria-labelledby={labelId}
        aria-invalid={Boolean(error)}
        onChange={handleChange}
      />
      {error ? (
        <p role="alert" className="field__error">
          {error}
        </p>
      ) : (
        <p className="field__hint">JPEG, PNG o WEBP · máx. 2 MB</p>
      )}
    </div>
  );
}
