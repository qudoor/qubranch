/*
 * @Date: 2022-03-31 08:48:37
 * @Description:
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    jasmine: true,
    jest: true,
    es6: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    parser: 'babel-eslint'
  },

  extends: ['plugin:vue/vue3-recommended', 'prettier'],
  plugins: ['markdown', 'jest', '@typescript-eslint'],
  overrides: [
    {
      files: ['*.md'],
      processor: 'markdown/markdown',
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['*.ts', '*.tsx'],
      extends: ['@vue/typescript/recommended', '@vue/prettier', '@vue/prettier/@typescript-eslint'],
      parserOptions: {
        project: './tsconfig.json'
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/ban-types': 0,
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 0,
        '@typescript-eslint/no-empty-function': 0,
        '@typescript-eslint/no-non-null-assertion': 0,
        '@typescript-eslint/no-var-requires': 0,
        '@typescript-eslint/no-unused-vars': [
          'error',
          { vars: 'all', args: 'after-used', ignoreRestSiblings: true }
        ],
        '@typescript-eslint/ban-ts-comment': 0
      }
    },
    {
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      },
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { vars: 'all', args: 'after-used', ignoreRestSiblings: true }
        ]
      }
    }
  ],
  rules: {
    "endOfLine": 0,
    semi: 0,
    'no-var': 'error',
    'no-console': 1,
    'object-shorthand': 2,
    'no-unused-vars': [2, { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
    'no-undef': 2,
    camelcase: 'off',
    'no-extra-boolean-cast': 'off',
    'vue/no-v-html': 'off',
    'vue/require-explicit-emits': 'off',
    'vue/require-prop-types': 'off',
    'vue/no-reserved-keys': 'off',
    'vue/comment-directive': 'off',
    'vue/prop-name-casing': 'off',
    'vue/one-component-per-file': 'off',
    'vue/custom-event-name-casing': 'off',
    'vue/max-attributes-per-line': [
      2,
      {
        singleline: 20,
        multiline: {
          max: 1,
          allowFirstLine: false
        }
      }
    ]
  },
  globals: {
    h: true,
    defineProps: true,
    defineEmits: true,
    defineExpose: true
  }
};
