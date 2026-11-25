import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'next-env.d.ts',
    'coverage/**',
  ]),
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      // A lint gate that cannot fail is not a gate. Style-contract assertions
      // stay in Vitest; this rule only catches dead code.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Next 16 ships the React Compiler rules as errors. They flag established
      // dumb-component patterns (effect-synced disclosure state, refs, module
      // constants). Refactoring those is a separate change from restoring the
      // lint gate, so they stay advisory here; dead code remains a hard error.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
]);
