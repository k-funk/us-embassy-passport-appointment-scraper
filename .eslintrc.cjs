// NOTE: if these rules are causing `npm run build`s to fail locally, it's probably cause you ran
// `npm install` instead of `NODE_ENV=production npm install`, which installs different dependency trees
module.exports = {
  'extends': [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:jest/recommended',
  ],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2022,
  //   tsconfigRootDir: __dirname,
  //   project: ['./tsconfig.json'],
  },
  'plugins': [
    'jest',
  ],
  'settings': {
    'jest': {
      'version': 26,
    },
  },
  'env': {
    'jest/globals': true,
    es6: true,
    node: true,
  },
  'rules': {
    'array-bracket-spacing': ['warn', 'never'],
    'array-element-newline': ['warn', 'consistent'],
    'arrow-spacing': 'warn',
    'comma-dangle': [
      'warn',
      {
        'arrays': 'always-multiline',
        'objects': 'always-multiline',
        'imports': 'always-multiline',
        'exports': 'always-multiline',
        'functions': 'always-multiline',
      },
    ],
    'eol-last': ['warn'],
    'eqeqeq': [
      'warn',
      'always',
      {
        'null': 'ignore',
      },
    ],
    'global-require': 'warn',
    'import/newline-after-import': 'warn',
    'import/order': [
      'warn',
      {
        'groups': [
          [
            'builtin',
            'external',
            'internal',
          ],
        ],
        'newlines-between': 'always',
      },
    ],
    'indent': [
      'warn',
      2,
      {
        'SwitchCase': 1,
      },
    ],
    'jest/expect-expect': 0, // https://github.com/jest-community/eslint-plugin-jest/issues/534
    'jest/no-standalone-expect': [
      'warn',
      {
        'additionalTestBlockFunctions': [
          'afterEach',
          'afterAll',
        ],
      },
    ],
    'key-spacing': ['warn', { 'afterColon': true, 'beforeColon': false, 'mode': 'strict' }],
    'keyword-spacing': 'warn',
    'no-console': [
      'warn',
      {
        'allow': [
          'debug',
          'info',
          'warn',
          'error',
        ],
      },
    ],
    'no-duplicate-imports': 'warn',
    'no-empty': [
      'warn',
      {
        'allowEmptyCatch': true,
      },
    ],
    'no-multiple-empty-lines': [
      'warn',
      {
        'max': 2,
        'maxBOF': 0,
        'maxEOF': 0,
      },
    ],
    'no-nested-ternary': 'warn',
    'no-template-curly-in-string': 'warn',
    'no-trailing-spaces': 'warn',
    'no-unneeded-ternary': 'warn',
    'no-var': 'warn',
    'operator-linebreak': [
      'warn',
      'before',
    ],
    'padded-blocks': [
      'warn',
      {
        'blocks': 'never',
        'classes': 'never',
        'switches': 'never',
      },
      {
        'allowSingleLineBlocks': true,
      },
    ],
    'prefer-arrow-callback': [
      'warn',
      {
        'allowNamedFunctions': true,
      },
    ],
    'prefer-const': 'warn',
    'prefer-object-spread': 'warn',
    'prefer-spread': 'warn',
    'prefer-template': 'warn',
    'quotes': [
      'warn',
      'single',
    ],
    'require-await': 'warn',
    'semi': [
      'warn',
      'never',
    ],
    'space-before-blocks': 'warn',
    'space-before-function-paren': [
      'warn',
      {
        'anonymous': 'never',
        'named': 'never',
        'asyncArrow': 'always',
      },
    ],
    'space-in-parens': 'warn',
    'template-curly-spacing': [
      'warn',
      'never',
    ],
  },
}
