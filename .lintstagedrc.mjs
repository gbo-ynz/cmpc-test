// Runs each workspace's own ESLint config against the staged files only.
// Prettier runs FIRST: ESLint must validate the code exactly as it will be committed. The reverse
// order let Prettier re-wrap lines after ESLint had passed and push files over the 60-line limit.
const quote = (files) => files.map((file) => `"${file}"`).join(' ');

const lintWorkspace = (workspace) => (files) => [
  `prettier --write ${quote(files)}`,
  `npm exec --workspace ${workspace} -- eslint --fix --max-warnings=0 ${quote(files)}`,
];

export default {
  'apps/api/**/*.ts': lintWorkspace('apps/api'),
  'apps/web/**/*.{ts,tsx}': lintWorkspace('apps/web'),
  'apps/e2e/**/*.ts': lintWorkspace('apps/e2e'),
  '*.{json,md,yml,yaml,css}': 'prettier --write',
};
