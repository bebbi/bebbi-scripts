import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import spawn from 'cross-spawn'
import yargsParser from 'yargs-parser'
import {
  appDirectory,
  getConcurrentlyArgs,
  hasPkgProp,
  OneOrMany,
  pkg,
  resolveBin,
} from '../utils'

console.log('Running `bebbi-scripts build`, Please wait...')

const args = process.argv.slice(2).filter((f) => f !== '--no-banner')
const parsedArgs = yargsParser(args)

const here = (p: string) => path.join(__dirname, p)
const hereRelative = (p: string) => here(p).replace(process.cwd(), '.')

// this creates a new directory from a hash of the path being built to store temp config files.
// Doing it this way prevents race-conditions if two packages are being build concurrently.
const confAppDir = crypto.createHash('md5').update(appDirectory).digest('hex')
// this copies the tsconfig directory recursively into the path specific build config
fs.cpSync(
  hereRelative('../config/tsconfig'),
  hereRelative(`../config/${confAppDir}`),
  { recursive: true },
)
// this converts the tsconfig.js files copied in the previous step over to tsconfig.json files
const makeTsConfig =
  /* eslint-disable @typescript-eslint/no-var-requires */
  (require(`../config/${confAppDir}`) as Record<'config', () => Promise<void>>)
    .config as () => Promise<void>
/* eslint-enable @typescript-eslint/no-var-requires */

const useBuiltinConfig = !args.includes('--project')

const buildTypes = ['cjs', 'esm', 'types'] as const

const passThroughArgs = [...args].filter(
  (a) => !(buildTypes as unknown as string[]).includes(a),
)

const getPackageBuildProps = (): Partial<
  Record<(typeof buildTypes)[number], OneOrMany<string[]>>
> => {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
  const build = typeof pkg?.build === 'string' ? [pkg.build] : pkg?.build ?? []
  if (Array.isArray(build)) {
    const res = Object.fromEntries(
      buildTypes.map((b) => {
        return [b, build.map((arg: unknown) => arg?.toString() ?? '')]
      }),
    )
    return res
  }
  const buildConfig: Partial<
    Record<(typeof buildTypes)[number], OneOrMany<string[]>>
  > = {}
  if (typeof build === 'object' && build.hasOwnProperty('cjs')) {
    if (typeof build.cjs === 'string') buildConfig.cjs = [build.cjs]
    if (Array.isArray(build.cjs)) {
      buildConfig.cjs = build.cjs.filter(
        (arg: unknown) => typeof arg === 'string',
      )
    }
  }
  if (typeof build === 'object' && build.hasOwnProperty('esm')) {
    if (typeof build.esm === 'string') buildConfig.esm = [build.esm]
    if (Array.isArray(build.esm)) {
      buildConfig.esm = build.esm.filter(
        (arg: unknown) => typeof arg === 'string',
      )
    }
  }

  if (typeof build === 'object' && build.hasOwnProperty('types')) {
    if (typeof build.types === 'string') buildConfig.types = [build.types]
    if (Array.isArray(build.types)) {
      buildConfig.types = build.types.filter(
        (arg: unknown) => typeof arg === 'string',
      )
    }
  }
  return buildConfig
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
}

const packageArgs: Partial<
  Record<(typeof buildTypes)[number], OneOrMany<string[]>>
> = hasPkgProp('build') ? getPackageBuildProps() : {}

export const compileToOptions: Record<(typeof buildTypes)[number], string> = {
  cjs: [
    resolveBin('typescript', { executable: 'tsc' }),
    '--baseUrl',
    confAppDir,
    '--project',
    hereRelative(`../config/${confAppDir}/cjs/tsconfig.json`),
    ...(packageArgs.cjs ?? []),
    ...passThroughArgs,
  ].join(' '),
  esm: [
    resolveBin('typescript', { executable: 'tsc' }),
    '--baseUrl',
    confAppDir,
    '--project',
    hereRelative(`../config/${confAppDir}/esm/tsconfig.json`),
    ...(packageArgs.esm ?? []),
    ...passThroughArgs,
  ].join(' '),
  types: [
    resolveBin('typescript', { executable: 'tsc' }),
    '--baseUrl',
    confAppDir,
    '--project',
    hereRelative(`../config/${confAppDir}/types/tsconfig.json`),
    ...(packageArgs.types ?? []),
    ...passThroughArgs,
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
  //   '--baseUrl',
  //   confAppDir,
  //   '--config',
  //   hereRelative(`../config/${confAppDir}/umd/tsconfig.json`),
  //   ...passThroughArgs,
  // ].join(' '),
  /*eslint no-warning-comments: "error"*/
}

let compileTo = parsedArgs._.length
  ? parsedArgs._.map((o) => o.toString()).filter((o) =>
      (buildTypes as unknown as string[]).includes(o),
    )
  : (buildTypes as unknown as string[])

if (compileTo.length < 1) {
  console.warn(
    `CAUTION: Did not find one of the build types in argument list specified, so by default building all of the build types: ${Object.keys(
      compileToOptions,
    )}. If this is unexpected, run the \`clean\` script and specify your desired build type.`,
  )
  compileTo = buildTypes as unknown as string[]
}

const go = () => {
  const buildScripts: Record<string, string> = Object.fromEntries(
    Object.entries(compileToOptions).filter(([opt]) => compileTo.includes(opt)),
  )
  if (useBuiltinConfig) {
    if (Object.keys(buildScripts).length > 1 && passThroughArgs.length > 1) {
      console.warn(
        `WARNING!: Using more than one build type with passed through args. Each build type will be given the passed through args. If this was not the intention, then call the builds independently specifying the build type.`,
      )
    }
    const result = spawn.sync(
      resolveBin('concurrently'),
      getConcurrentlyArgs(buildScripts),
      { stdio: 'inherit' },
    )
    return result.status ?? undefined
  }
  const result = spawn.sync(
    [resolveBin('typescript', { executable: 'tsc' }), ...args].join(' '),
  )
  return result.status ?? undefined
}

makeTsConfig()
  .then(() => process.exit(go()))
  .catch(() => {})
