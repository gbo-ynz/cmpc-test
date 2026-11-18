import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Same hard limit as the apps: no module may exceed 60 lines.
const MAX_FILE_LINES = 60;

export default tseslint.config(
  { ignores: ['playwright-report', 'test-results', '.auth'] },
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
    rules: {
      'max-lines': ['error', { max: MAX_FILE_LINES, skipBlankLines: true, skipComments: true }],
      'no-console': 'error',
    },
  },
);
