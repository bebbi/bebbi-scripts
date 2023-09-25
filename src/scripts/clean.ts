import { rimrafSync } from 'rimraf'
import yargsParser from 'yargs-parser'
import { appDirectory, log } from '..'
import path = require('path')

console.log('Running `bebbi-scripts clean`, Please wait...')

const args = process.argv.slice(2).filter((f) => f !== '--no-banner')
const parsedArgs = yargsParser(args)

const buildOptions = ['cjs', 'esm', 'types', 'umd']

const cleanDirs = parsedArgs._.length
  ? parsedArgs._.map((o) => o.toString()).filter((o) =>
      buildOptions.includes(o),
    )
  : []

if (cleanDirs.length > 0) {
  cleanDirs.forEach((dir) => {
    const deleteDir = path.join(appDirectory, 'dist', dir)
    console.log(`Deleting: ${deleteDir}`)
    rimrafSync(deleteDir)
  })
} else {
  if (parsedArgs._.length) {
    log.error(`Invalid argument passed: \`${parsedArgs._.join('`, `')}\``)
    process.exit(1)
  }

  const deleteDir = path.join(appDirectory, 'dist')
  rimrafSync(deleteDir)
  log.success(`Deleted: ${deleteDir}`)
}
