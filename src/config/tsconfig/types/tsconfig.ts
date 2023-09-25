import { appDirectory } from '../../../utils'
import path from 'path'

module.exports = {
  include: [path.join(appDirectory, 'src/**/*')],
  extends: path.join(appDirectory, 'tsconfig'),
  compilerOptions: {
    declaration: true,
    emitDeclarationOnly: true,
    outDir: path.join(appDirectory, 'dist/types'),
  },
}
