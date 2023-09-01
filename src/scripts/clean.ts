import { rimrafSync } from 'rimraf'
import yargsParser from 'yargs-parser'
import { appDirectory, log } from '..'

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
    console.log(`Deleting: ${appDirectory}/dist/${dir}`)
    rimrafSync(`${appDirectory}/dist/${dir}`)
  })
} else {
  if (parsedArgs._.length) {
    log.error(`Invalid argument passed: \`${parsedArgs._.join('`, `')}\``)
    process.exit(1)
  }

  rimrafSync(`${appDirectory}/dist`)
  log.success(`Deleted: ${appDirectory}/dist`)
}
