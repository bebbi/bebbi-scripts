/* eslint-disable import/no-import-module-exports */
import { appDirectory } from '../../../utils'

module.exports = {
  include: [`${appDirectory}/src/**/*`],
  extends: `${appDirectory}/tsconfig`,
  compilerOptions: {
    module: 'commonjs',
    declaration: false,
    outDir: `${appDirectory}/dist/udm`,
  },
}
