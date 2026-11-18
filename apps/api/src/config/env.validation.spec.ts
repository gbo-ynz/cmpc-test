import { validateEnv } from './env.validation';

const VALID_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('applies defaults when optional variables are missing', () => {
    const config = validateEnv(VALID_ENV);

    expect(config.PORT).toBe(3000);
    expect(config.JWT_EXPIRES_IN_SECONDS).toBe(3600);
    expect(config.UPLOADS_DIR).toBe('uploads');
  });

  it('converts numeric strings coming from process.env', () => {
    const config = validateEnv({ ...VALID_ENV, PORT: '8080' });

    expect(config.PORT).toBe(8080);
  });

  it('fails fast when the JWT secret is too short', () => {
    expect(() => validateEnv({ ...VALID_ENV, JWT_SECRET: 'short' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('fails when DATABASE_URL is missing', () => {
    expect(() => validateEnv({ JWT_SECRET: VALID_ENV.JWT_SECRET })).toThrow(/DATABASE_URL/);
  });
});
