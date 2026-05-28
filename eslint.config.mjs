import js from '@eslint/js';
import ts from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default ts.config(
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**', 'out/**', 'scripts/**'],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'react/react-in-jsx-scope': 'off',
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },
);
