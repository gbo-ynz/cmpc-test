import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

const ONE_HOUR_IN_SECONDS = 3600;

export class EnvironmentVariables {
  // Explicit types are required: class-transformer converts using the emitted design:type.
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsInt()
  @Min(60)
  JWT_EXPIRES_IN_SECONDS: number = ONE_HOUR_IN_SECONDS;

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:5173';

  @IsString()
  UPLOADS_DIR: string = 'uploads';
}

/** Fail fast at boot when the environment is incomplete or malformed. */
export function validateEnv(raw: Record<string, unknown>): EnvironmentVariables {
  const config = plainToInstance(EnvironmentVariables, raw, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });
  const errors = validateSync(config, { skipMissingProperties: false });
  if (errors.length > 0) {
    const reasons = errors.flatMap((error) => Object.values(error.constraints ?? {}));
    throw new Error(`Invalid environment configuration: ${reasons.join('; ')}`);
  }
  return config;
}
