import js from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import pluginImport from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactNamingConvention from 'eslint-plugin-react-naming-convention';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      import: pluginImport,
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-console': 'error',
    },
  },
  {
    plugins: {
      'check-file': checkFile,
    },
    files: ['src/**/!(__tests__)/*'],
    rules: {
      'check-file/folder-naming-convention': [
        'error',
        {
          '**/*': 'KEBAB_CASE',
        },
      ],
    },
  },
  {
    files: ['**/types/*.ts', '**/*.d.ts'],
    ignores: ['**/index.ts', 'src/vite-env.d.ts'],
    plugins: {
      'react-naming-convention': reactNamingConvention,
    },
    rules: {
      'react-naming-convention/filename': ['error', 'PascalCase'],
    },
  },
  {
    files: ['**/*.ts'],
    ignores: ['**/types/*.ts', '**/enums/*.ts', '**/I**.ts', '**/*.d.ts'],
    plugins: {
      'react-naming-convention': reactNamingConvention,
    },
    rules: {
      'react-naming-convention/filename': ['error', 'camelCase'],
    },
  },
  // eslint-plugin-prettier/recommended sets up eslint-plugin-prettier and
  // eslint-config-prettier together. It must be last so prettier can override
  // formatting rules from the configs above.
  eslintPluginPrettierRecommended,
);
