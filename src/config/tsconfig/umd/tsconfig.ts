import { appDirectory } from '../../../utils'
import path from 'path'

module.exports = {
  include: [path.join(appDirectory, 'src/**/*')],
  extends: path.join(appDirectory, 'tsconfig'),
  compilerOptions: {
    module: 'commonjs',
    declaration: false,
    outDir: path.join(appDirectory, 'dist/umd'),
  },
}
