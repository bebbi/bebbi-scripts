import { rimrafSync } from 'rimraf'
import { appDirectory, log } from '.'
import path = require('path')

// Clean the dist folder based on provided arguments
export function cleanDistFolder(cleanDirs: string[] = []) {
  if (cleanDirs.length > 0) {
    cleanDirs.forEach((dir) => {
      const deleteDir = path.join(appDirectory, 'dist', dir)
      rimrafSync(deleteDir)
      console.log(`Deleted: ${deleteDir}`)
    })
  } else {
    const deleteDir = path.join(appDirectory, 'dist')
    rimrafSync(deleteDir)
    log.success(`Deleted: ${deleteDir}`)
  }
}
