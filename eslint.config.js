const nextConfig = require('eslint-config-next')

module.exports = [
  ...nextConfig,
  {
    ignores: ['node_modules/**', '.next/**', '__tests__/**'],
  },
  {
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
]
