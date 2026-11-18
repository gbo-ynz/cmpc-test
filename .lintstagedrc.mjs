// Runs each workspace's own ESLint config against the staged files only.
const quote = (files) => files.map((file) => `"${file}"`).join(' ');

export default {
  'apps/api/**/*.ts': (files) => [
    `npm exec --workspace apps/api -- eslint --fix --max-warnings=0 ${quote(files)}`,
    `prettier --write ${quote(files)}`,
  ],
  'apps/web/**/*.{ts,tsx}': (files) => [
    `npm exec --workspace apps/web -- eslint --fix --max-warnings=0 ${quote(files)}`,
    `prettier --write ${quote(files)}`,
  ],
  'apps/e2e/**/*.ts': (files) => [
    `npm exec --workspace apps/e2e -- eslint --fix --max-warnings=0 ${quote(files)}`,
    `prettier --write ${quote(files)}`,
  ],
  '*.{json,md,yml,yaml,css}': 'prettier --write',
};
