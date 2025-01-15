import yargsParser from 'yargs-parser'
import { log } from '..'

import { cleanDistFolder } from '../cleanDistFolder'

console.log('Running `bebbi-scripts clean`, Please wait...')

const args = process.argv.slice(2).filter((f) => f !== '--no-banner')
const parsedArgs = yargsParser(args)

const buildTypes = ['cjs', 'esm', 'types'] as const

const cleanDirs = parsedArgs._.length
  ? parsedArgs._.map((o) => o.toString()).filter((o) =>
      (buildTypes as unknown as string[]).includes(o),
    )
  : []

if (!cleanDirs.length && parsedArgs._.length) {
  log.error(`Invalid argument passed: \`${parsedArgs._.join('`, `')}\``)
  process.exit(1)
}

cleanDistFolder(cleanDirs)
