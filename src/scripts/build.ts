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
  log,
  toPOSIX,
  toRelative,
} from '../utils'
import { cleanDistFolder } from '../cleanDistFolder'

console.log('Running `bebbi-scripts build`, Please wait...')

const args = process.argv.slice(2).filter((f) => f !== '--no-banner')
const parsedArgs = yargsParser(args)

const here = (p: string) => path.join(__dirname, p)

// this creates a new directory from a hash of the path being built to store temp config files.
// Doing it this way prevents race-conditions if two packages are being build concurrently.
const confAppDir = crypto.createHash('md5').update(appDirectory).digest('hex')
// this copies the tsconfig directory recursively into the path specific build config
fs.cpSync(
  toRelative(here('../config/tsconfig')),
  toRelative(here(`../config/${confAppDir}`)),
  { recursive: true },
)
// this converts the tsconfig.js files copied in the previous step over to tsconfig.json files
const makeTsConfig =
  /* eslint-disable @typescript-eslint/no-var-requires */
  (
    require(path.join('../config', confAppDir)) as Record<
      'config',
      () => Promise<void>
    >
  ).config as () => Promise<void>
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

const useBuiltinConfig = !args.includes('--project')

const buildTypes = ['cjs', 'esm', 'types'] as const

const passThroughArgs = [...args].filter(
  (a) => !(buildTypes as unknown as string[]).includes(a),
)

const getPackageBuildProps = (): Partial<
  Record<(typeof buildTypes)[number], OneOrMany<string[]>>
> => {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
  const build =
    typeof pkg?.['build'] === 'string' ? [pkg['build']] : pkg?.['build'] ?? []
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
    toPOSIX(resolveBin('typescript', { executable: 'tsc' })),
    '--baseUrl',
    confAppDir,
    '--project',
    toPOSIX(toRelative(here(`../config/${confAppDir}/cjs/tsconfig.json`))),
    ...(packageArgs.cjs ?? []),
    ...passThroughArgs,
  ].join(' '),
  esm: [
    toPOSIX(resolveBin('typescript', { executable: 'tsc' })),
    '--baseUrl',
    confAppDir,
    '--project',
    toPOSIX(toRelative(here(`../config/${confAppDir}/esm/tsconfig.json`))),
    ...(packageArgs.esm ?? []),
    ...passThroughArgs,
  ].join(' '),
  types: [
    toPOSIX(resolveBin('typescript', { executable: 'tsc' })),
    '--baseUrl',
    confAppDir,
    '--project',
    toPOSIX(toRelative(here(`../config/${confAppDir}/types/tsconfig.json`))),
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
  //   toPOSIX(resolveBin('webpack')),
  //   '--baseUrl',
  //   confAppDir,
  //   '--config',
  //   toPOSIX(toRelative(here(`../config/${confAppDir}/umd/tsconfig.json`))),
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
  log.warn(
    `Did not find one of the build types in argument list specified, so by default building all of the build types: ${Object.keys(
      compileToOptions,
    )}. If this is unexpected, run the \`clean\` script and specify your desired build type.`,
  )
  compileTo = buildTypes as unknown as string[]
}

const go = () => {
  const buildScripts: Record<string, string> = Object.fromEntries(
    Object.entries(compileToOptions).filter(([opt]) => compileTo.includes(opt)),
  )

  function findSourceFile(
    p1: string,
    fullPath: string,
  ): 'file' | 'directory' | false {
    // Get the directory containing the importing file
    const dir = path.dirname(fullPath)
    // Resolve the imported path relative to the importing file
    const resolvedPath = path.resolve(dir, p1)

    try {
      const stats = fs.statSync(resolvedPath)
      if (stats.isDirectory()) {
        return 'directory'
      }
      if (stats.isFile()) {
        return 'file'
      }
    } catch (e) {
      // Path doesn't exist
    }
    // If neither exists, default to treating it as a file
    // This maintains compatibility with the TypeScript compiler's output
    return false
  }

  function transformImports(
    content: string,
    fullPath: string,
    targetExt: 'js' | 'cjs',
  ): string {
    // Helper to process the import path consistently for both ESM and CJS
    const processImportPath = (p1: string) => {
      // Handle relative imports (starting with ./ or ../)
      if (p1.match(/^\.\.?\//) !== null) {
        if (!p1.endsWith('.js') && !p1.endsWith('.cjs')) {
          const sourceType = findSourceFile(p1, fullPath)
          if (sourceType === 'file' || sourceType === false) {
            return `${p1}.${targetExt}`
          }
          // It's a directory
          return `${p1}/index.${targetExt}`
        }
        return p1.endsWith('.js') ? p1.replace(/\.js$/, `.${targetExt}`) : p1
      }

      return p1
    }

    // Handle ESM imports
    content = content.replace(
      /from ['"]([^'"]+)['"]/g,
      (match, p1) => `from '${processImportPath(p1)}'`,
    )

    // Handle CJS requires
    content = content.replace(
      /require\(['"]([^'"]+)['"]\)/g,
      (match, p1) => `require('${processImportPath(p1)}')`,
    )

    return content
  }

  if (useBuiltinConfig) {
    if (Object.keys(buildScripts).length > 1 && passThroughArgs.length > 1) {
      log.warn(
        `Using more than one build type with passed through args. Each build type will be given the passed through args. If this was not the intention, then call the builds independently specifying the build type.`,
      )
    }
    const result = spawn.sync(
      resolveBin('concurrently'),
      getConcurrentlyArgs(buildScripts),
      { stdio: 'inherit' },
    )

    // Run post-build step to rename CJS files only if package is type: module
    if (buildScripts.hasOwnProperty('cjs') && pkg?.type === 'module') {
      const cjsDir = path.join(appDirectory, 'dist', 'cjs')
      if (fs.existsSync(cjsDir)) {
        const renameFilesInDir = (dir: string) => {
          const dirEntries = fs.readdirSync(dir, { withFileTypes: true })
          for (const entry of dirEntries) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              renameFilesInDir(fullPath)
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
              const newPath = fullPath.replace(/\.js$/, '.cjs')
              let content = fs.readFileSync(fullPath, 'utf8')
              content = transformImports(content, fullPath, 'cjs')
              fs.writeFileSync(newPath, content)
              fs.unlinkSync(fullPath)
            }
          }
        }
        renameFilesInDir(cjsDir)
      }
    }

    // Run post-build step for ESM files to ensure proper ESM-compatible imports.
    if (buildScripts.hasOwnProperty('esm')) {
      const esmDir = path.join(appDirectory, 'dist', 'esm')
      if (fs.existsSync(esmDir)) {
        const updateImportsInDir = (dir: string) => {
          const dirEntries = fs.readdirSync(dir, { withFileTypes: true })
          for (const entry of dirEntries) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              updateImportsInDir(fullPath)
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
              let content = fs.readFileSync(fullPath, 'utf8')
              content = transformImports(content, fullPath, 'js')
              fs.writeFileSync(fullPath, content)
            }
          }
        }
        updateImportsInDir(esmDir)
      }
    }

    return result.status ?? undefined
  }
  const result = spawn.sync(
    [resolveBin('typescript', { executable: 'tsc' }), ...args].join(' '),
  )
  return result.status ?? 0
}

cleanDistFolder()

makeTsConfig()
  .then(() => process.exit(go()))
  .catch(() => {})
