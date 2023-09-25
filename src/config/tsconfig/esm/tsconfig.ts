import { appDirectory } from '../../../utils'
import path from 'path'

module.exports = {
  include: [path.join(appDirectory, 'src/**/*')],
  extends: path.join(appDirectory, 'tsconfig'),
  compilerOptions: {
    module: 'ESNext',
    moduleResolution: 'node',
    outDir: path.join(appDirectory, 'dist/esm'),
  },
}
