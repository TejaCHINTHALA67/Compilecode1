module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'prettier/prettier': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
  overrides: [
    {
      files: ['backend/**/*.js'],
      env: { node: true, jest: true, es6: true },
      parser: 'espree',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
        requireConfigFile: false,
      },
      extends: ['eslint:recommended'],
      rules: {
        'no-console': 'off',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'quotes': 'off',
        'prettier/prettier': 'off',
      },
    },
  ],
};
