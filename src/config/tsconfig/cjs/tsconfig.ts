import path from 'path'
import { appDirectory, toPOSIX } from '../../../utils'

module.exports = {
  include: [toPOSIX(path.join(appDirectory, 'src/**/*'))],
  extends: toPOSIX(path.join(appDirectory, 'tsconfig')),
  compilerOptions: {
    module: 'commonjs',
    outDir: toPOSIX(path.join(appDirectory, 'dist/cjs')),
  },
  exclude: ['js', 'jsx', 'ts', 'tsx'].flatMap((ext) =>
    ['test', 'stories'].map((name) =>
      path.join(appDirectory, `src/**/*.${name}.${ext}`),
    ),
  ),
}
