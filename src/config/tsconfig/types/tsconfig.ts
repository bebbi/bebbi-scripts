import { appDirectory, toPOSIX } from '../../../utils'
import path from 'path'

module.exports = {
  include: [toPOSIX(path.join(appDirectory, 'src/**/*'))],
  extends: toPOSIX(path.join(appDirectory, 'tsconfig')),
  compilerOptions: {
    declaration: true,
    emitDeclarationOnly: true,
    outDir: toPOSIX(path.join(appDirectory, 'dist/types')),
  },
}
