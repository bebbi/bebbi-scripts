import path from 'path'
import { appDirectory, toPOSIX } from '../../../utils'

module.exports = {
  include: [toPOSIX(path.join(appDirectory, 'src/**/*'))],
  extends: toPOSIX(path.join(appDirectory, 'tsconfig')),
  compilerOptions: {
    declaration: true,
    emitDeclarationOnly: true,
    outDir: toPOSIX(path.join(appDirectory, 'dist/types')),
  },
  exclude: ['js', 'jsx', 'ts', 'tsx'].map((ext) =>
    path.join(appDirectory, `src/**/*.test.${ext}`),
  ),
}
