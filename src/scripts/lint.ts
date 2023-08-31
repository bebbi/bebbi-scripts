import path from 'path'
import spawn from 'cross-spawn'
import yargsParser from 'yargs-parser'
import { hasPkgProp, resolveBin, hasFile, fromRoot } from '../utils'

console.log('Running `bebbi-scripts lint`, Please wait...')

let args = process.argv.slice(2).filter((f) => f !== '--no-banner')
const here = (p: string) => path.join(__dirname, p)
const hereRelative = (p: string) => here(p).replace(process.cwd(), '.')
const parsedArgs = yargsParser(args)

const useBuiltinConfig =
  !args.includes('--config') &&
  !hasFile('.eslintrc') &&
  !hasFile('.eslintrc.js') &&
  !hasPkgProp('eslintConfig')

const config = useBuiltinConfig
  ? ['--config', hereRelative('../config/eslintrc.js')]
  : []

const defaultExtensions = 'js,ts,tsx'
const ext = args.includes('--ext') ? [] : ['--ext', defaultExtensions]
const extensions: string[] = (
  (parsedArgs.ext as string) || defaultExtensions
).split(',')

const useBuiltinIgnore =
  !args.includes('--ignore-path') &&
  !hasFile('.eslintignore') &&
  !hasPkgProp('eslintIgnore')

const ignore = useBuiltinIgnore
  ? ['--ignore-path', hereRelative('../config/eslintignore')]
  : []

const cache = args.includes('--no-cache')
  ? []
  : [
      '--cache',
      '--cache-location',
      fromRoot('node_modules/.cache/.eslintcache'),
    ]

const filesGiven = parsedArgs._.length > 0

const filesToApply = filesGiven ? [] : ['.']

if (filesGiven) {
  // we need to take all the flag-less arguments (the files that should be linted)
  // and filter out the ones that aren't js files. Otherwise json or css files
  // may be passed through
  args = args.filter(
    (a) => !parsedArgs._.includes(a) || extensions.some((e) => a.endsWith(e)),
  )
}

const result = spawn.sync(
  resolveBin('eslint'),
  [...config, ...ext, ...ignore, ...cache, ...args, ...filesToApply],
  { stdio: 'inherit' },
)

process.exit(result.status ?? undefined)
