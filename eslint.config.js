import vue from 'eslint-plugin-vue'

export default [
  ...vue.configs['flat/essential'],
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        getCurrentPages: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        uni: 'readonly',
        URL: 'readonly',
        window: 'readonly',
        wx: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'error',
      'vue/multi-word-component-names': 'off',
    },
  },
]
