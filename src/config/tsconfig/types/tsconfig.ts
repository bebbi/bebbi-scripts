/* eslint-disable import/no-import-module-exports */
import { appDirectory } from '../../../utils'

module.exports = {
  include: [`${appDirectory}/src/**/*`],
  extends: `${appDirectory}/tsconfig`,
  compilerOptions: {
    declaration: true,
    emitDeclarationOnly: true,
    outDir: `${appDirectory}/dist/types`,
  },
}
