import { defineConfig } from 'eslint/config'
import baseConfig from '@wemogy/config/eslint/react.js'

export default defineConfig([
  {
    extends: [baseConfig],
  },
])
