import { appDirectory, toPOSIX } from '../../../utils'
import path from 'path'

module.exports = {
  include: [toPOSIX(path.join(appDirectory, 'src/**/*'))],
  extends: toPOSIX(path.join(appDirectory, 'tsconfig')),
  compilerOptions: {
    module: 'commonjs',
    outDir: toPOSIX(path.join(appDirectory, 'dist/cjs')),
  },
}
