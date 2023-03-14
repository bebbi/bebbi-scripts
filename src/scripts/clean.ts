import rimraf from 'rimraf'
import yargsParser from 'yargs-parser'
import { appDirectory, isBebbiScripts } from '../utils'

console.log('Running `bebbi-scripts clean`, Please wait...')

const args = process.argv.slice(2).filter((f) => f !== '--no-banner')
const parsedArgs = yargsParser(args)

const buildOptions = ['cjs', 'esm', 'types', 'umd']

const cleanDirs = parsedArgs._.length
  ? parsedArgs._.map((o) => o.toString()).filter((o) =>
      buildOptions.includes(o)
    )
  : []

if (!isBebbiScripts() && cleanDirs.length > 0) {
  cleanDirs.forEach((dir) => {
    console.log(`Deleting: ${appDirectory}/dist/${dir}`)
    rimraf.rimrafSync(`${appDirectory}/dist/${dir}`)
  })
} else {
  if (parsedArgs._.length) {
    console.error(
      `Arguments were provided that did not match build options: \`${parsedArgs._.join(
        '`, `'
      )}\``
    )
    process.exit(1)
  }
  console.log(`Deleting: ${appDirectory}/dist`)
  rimraf.rimrafSync(`${appDirectory}/dist`)
}
