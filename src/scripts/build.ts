import path from 'path'
import spawn from 'cross-spawn'
import yargsParser from 'yargs-parser'
import {getConcurrentlyArgs, isBebbiScripts, resolveBin} from '../utils'

console.log('Running `bebbi-scripts build`, Please wait...')

if (isBebbiScripts()) {
  console.log(
    'The build script is not meant to be run within the context of the `bebbi-scripts` package itself. This build script should only be run from a parent project.',
  )
  process.exit(1)
}

const args = process.argv.slice(2)
const parsedArgs = yargsParser(args)

const here = (p: string) => path.join(__dirname, p)
const hereRelative = (p: string) => here(p).replace(process.cwd(), '.')

export const compileToOptions = {
  cjs: [
    resolveBin('typescript', {executable: 'tsc'}),
    '--project',
    hereRelative('../config/tsconfig.cjs.json'),
  ].join(' '),
  esm: [
    resolveBin('typescript', {executable: 'tsc'}),
    '--project',
    hereRelative('../config/tsconfig.esm.json'),
  ].join(' '),
  types: [
    resolveBin('typescript', {executable: 'tsc'}),
    '--project',
    hereRelative('../config/tsconfig.types.json'),
  ].join(' '),
  /*eslint no-warning-comments: "off"*/
  /**
   * FIXME:
   * There is some error with the umd/webpack config currently.
   * When trying to use it, I kept getting the error:
   * > ERROR TS18002: The 'files' list in config file 'tsconfig.json' is empty
   * Even after confirming that I added a `files` list, it still
   * threw this same error to no avail. Not needed to compile to
   * umd at this time, so I am bypassing this block for now.
   */
  // umd: [
  //   resolveBin('webpack'),
  //   '--config',
  //   hereRelative('../config/webpack.config.js'),
  // ].join(' '),
  /*eslint no-warning-comments: "error"*/
}

const compileTo = parsedArgs._.length
  ? parsedArgs._.map(o => o.toString()).filter(o =>
      Object.keys(compileToOptions).includes(o),
    )
  : Object.keys(compileToOptions)

if (compileTo.length < 1) {
  console.log({_: parsedArgs._, compileTo})
  throw new Error('Unknown build specified')
}

const go = () => {
  const scripts: Record<string, string> = Object.fromEntries(
    Object.entries(compileToOptions).filter(([opt]) => compileTo.includes(opt)),
  )
  const result = spawn.sync(
    resolveBin('concurrently'),
    getConcurrentlyArgs(scripts),
    {stdio: 'inherit'},
  )
  return result.status ?? undefined
}

process.exit(go())
