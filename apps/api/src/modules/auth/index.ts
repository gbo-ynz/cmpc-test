/**
 * Public HTTP surface of the auth module: other modules mark their routes and read the signed-in
 * user through these, never through the module's internal folders.
 */
export * from './infrastructure/http/admin-only.decorator';
export * from './infrastructure/http/current-user.decorator';
export * from './infrastructure/http/public.decorator';
export * from './infrastructure/http/roles.decorator';
