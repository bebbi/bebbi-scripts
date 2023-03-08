import path from 'path'
import spawn from 'cross-spawn'
import yargsParser from 'yargs-parser'
import {hasFile, hasLocalConfig, resolveBin} from '../utils'

console.log('Running `bebbi-scripts format`, Please wait...')

const args = process.argv.slice(2).filter(f => f !== '--no-banner')
const parsedArgs = yargsParser(args)

const here = (p: string) => path.join(__dirname, p)
const hereRelative = (p: string) => here(p).replace(process.cwd(), '.')

const useBuiltinConfig =
  !args.includes('--config') && !hasLocalConfig('prettier')
const config: string[] = useBuiltinConfig
  ? ['--config', hereRelative('../config/prettierrc.js')]
  : []

const useBuiltInIgnore =
  !args.includes('--ignore-path') && !hasFile('.prettierignore')
const ignore = useBuiltInIgnore
  ? ['--ignore-path', hereRelative('../config/prettierignore')]
  : []

const write = args.includes('--no-write') ? [] : ['--write']

const relativeArgs = args.map(a => a.replace(`${process.cwd()}/`, ''))

const filesToApply = parsedArgs._.length
  ? []
  : ['**/*.+(js|jsx|json|yml|yaml|css|less|scss|ts|tsx|md|gql|graphql|mdx|vue)']

const result = spawn.sync(
  resolveBin('prettier'),
  [...config, ...ignore, ...write, ...filesToApply].concat(relativeArgs),
  {stdio: 'inherit'},
)

process.exit(result.status ?? undefined)

// prettier --config ./dist/config/prettierrc.js --ignore-path ./dist/config/prettierignore --write '**/*.+(js|jsx|json|yml|yaml|css|less|scss|ts|tsx|md|gql|graphql|mdx|vue)'
