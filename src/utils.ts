import fs from 'fs'
import path from 'path'
import spawn from 'cross-spawn'
import { globSync } from 'glob'
import has from 'lodash.has'
import { cosmiconfigSync } from 'cosmiconfig'
/**
 * NOTE:
 *
 * TL;DR: Requires read-pkg-up@7.0.1 ONLY THIS VERSION WORKS!
 *
 * If you are here looking for ESM error for require vs. import,
 * then be sure that you have installed read-pkg-up@7.0.1
 * ref: https://github.com/sindresorhus/read-pkg-up/issues/17
 * ref: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
 * read-pkg-up v8+ is pure ESM, to it cannot be `require()`d from CommonJS
 * This means even when TypeScript compiles it to CommonJS it will error!
 */
import readPkgUp from 'read-pkg-up'
import { bebbiArt, signOff } from './bebbiArt'
import { resolveBin } from './resolveBin'
export { resolveBin } from './resolveBin'

const arrify = <T>(props: OneOrMany<T>): T[] =>
  Array.isArray(props) ? props : [props]

export const { packageJson: pkg, path: pkgPath = '' } =
  readPkgUp.sync({
    cwd: fs.realpathSync(process.cwd()),
  }) ?? {}

export const workSpaceDir = (maxPkgDepth = 2): string | null => {
  if (pkg?.workspaces) {
    return path.dirname(pkgPath)
  }
  let lastPkgPath = pkgPath
  while (lastPkgPath.endsWith('.json') && maxPkgDepth > 0) {
    const nextPath = lastPkgPath.split('/')
    nextPath.splice(-2)
    const tryNextPath = nextPath.join('/')
    if (tryNextPath !== '') {
      maxPkgDepth--
      const { packageJson: upPackageJson, path: upPath = '' } =
        readPkgUp.sync({
          cwd: tryNextPath,
        }) ?? {}
      lastPkgPath = upPath
      if (upPackageJson?.workspaces) {
        return path.dirname(upPath)
      }
    }
    if (tryNextPath === '') {
      break
    }
  }
  return null
}

export const isWS = () => pkg?.workspaces !== undefined

export const appDirectory = path.dirname(pkgPath)

export type OneOrMany<T> = T | T[]

export type NonNullable<T> = T extends null | undefined ? never : T

export const isBebbiScripts = () => pkg?.name === 'bebbi-scripts'

export const resolveBebbiScripts = () => {
  if (isBebbiScripts() || appDirectory.includes(path.join(__dirname, '..'))) {
    return require.resolve('./').replace(process.cwd(), '.')
  }
  return resolveBin('bebbi-scripts')
}

export const fromRoot = (...p: string[]) => path.join(appDirectory, ...p)

export const toPOSIX = (p: string) => p.split(path.sep).join(path.posix.sep)

export const hasFile = (...p: string[]) => fs.existsSync(fromRoot(...p))

export const hasPkgProp = (props: OneOrMany<string>) =>
  arrify(props).some((prop) => has(pkg, prop))

const hasPkgSubProp = (pkgProp: string) => (props: OneOrMany<string>) =>
  hasPkgProp(arrify(props).map((p) => `${pkgProp}.${p}`))

export const ifPkgSubProp =
  (pkgProp: string) =>
  <T = string | undefined, F = string | undefined>(
    props: OneOrMany<string>,
    t?: T,
    f?: F
  ): T | F extends undefined ? T | F | undefined : T | F =>
    hasPkgSubProp(pkgProp)(props) ? (t as T) : (f as F)

// const hasScript = hasPkgSubProp('scripts')
const hasPeerDep = hasPkgSubProp('peerDependencies')

const hasDep = hasPkgSubProp('dependencies')

const hasDevDep = hasPkgSubProp('devDependencies')

export const hasAnyDep = (args: OneOrMany<string>) =>
  [hasDep, hasDevDep, hasPeerDep].some((fn) => fn(args))

export const ifAnyDep = <T = OneOrMany<string>, F = OneOrMany<string>>(
  deps: OneOrMany<string>,
  t?: T,
  f?: F
) => (hasAnyDep(arrify(deps)) ? (t as T) : (f as F))

export const ifScript = ifPkgSubProp('scripts')

const scriptsPath = path.join(__dirname, 'scripts/')

const scriptsAvailable = globSync(toPOSIX(path.join(__dirname, 'scripts', '*')))

export const scripts = scriptsAvailable
  .map((s) => path.normalize(s))
  .map((s) => s.replace(scriptsPath, '').replace(/\.[tj]s$/, ''))
  .filter(Boolean)

const envIsSet = (name: string) => {
  return (
    process.env.hasOwnProperty(name) &&
    process.env[name] &&
    process.env[name] !== 'undefined'
  )
}

export const parseEnv = <D>(name: string, def: D): D | unknown => {
  if (envIsSet(name)) {
    try {
      return JSON.parse(process.env[name] ?? '')
    } catch (err: unknown) {
      return process.env[name]
    }
  }
  return def
}

export const getConcurrentlyArgs = (
  scriptsPassed: Record<string, string>,
  { killOthers = true } = {}
) => {
  const colors = [
    'bgBlue',
    'bgGreen',
    'bgMagenta',
    'bgCyan',
    'bgWhite',
    'bgRed',
    'bgBlack',
    'bgYellow',
  ]
  const scriptsCpy = Object.entries(scriptsPassed).reduce<
    Record<string, string>
  >((all, [name, script]) => {
    if (script) {
      all[name] = script
    }
    return all
  }, {})
  const prefixColors = Object.keys(scriptsCpy)
    .reduce<string[]>(
      (pColors, _s, i) =>
        pColors.concat([`${colors[i % colors.length]}.bold.white`]),
      []
    )
    .join(',')

  // prettier-ignore
  return [
    killOthers ? '--kill-others-on-fail' : '',
    '--prefix', '[{name}]',
    '--names', Object.keys(scriptsCpy).join(','),
    '--prefix-colors', prefixColors,
    ...Object.values(scriptsCpy).map((s) => JSON.stringify(s)),
  ].filter(Boolean)
}

export const attemptResolve = (...rest: Parameters<typeof require.resolve>) => {
  try {
    return require.resolve(...rest)
  } catch (_e: unknown) {
    return null
  }
}

export const getEnv = (script: string) => {
  return Object.keys(process.env)
    .filter((key) => process.env[key] !== undefined)
    .reduce<NodeJS.ProcessEnv>(
      (envCopy, key) => {
        envCopy[key] = process.env[key]
        return envCopy
      },
      {
        [`SCRIPTS_${script.toUpperCase().replace(/-/g, '_')}`]: 'true',
      }
    )
}

export const hasLocalConfig = (
  moduleName: string,
  searchOptions?: Parameters<typeof cosmiconfigSync>[1]
) => {
  const explorerSync = cosmiconfigSync(moduleName, searchOptions)
  const result = explorerSync.search(pkgPath)
  return result !== null
}

export const handleSignal = (
  script: string,
  res: ReturnType<typeof spawn.sync>
) => {
  if (res.signal === 'SIGKILL') {
    console.log(
      bebbiArt,
      `The script "${script}" failed because the process exited too early. `,
      'This probably means the system ran out of memory or someone called ',
      '`kill -9` on the process.'
    )
  } else if (res.signal === 'SIGTERM') {
    console.log(
      bebbiArt,
      `The script "${script}" failed because the process exited too early. `,
      'Someone might have called `kill` or `killall`, or the system could ',
      'be shutting down.'
    )
  }
  signOff()
  process.exit(1)
}

export const stdInput = () => {
  return new Promise<string>((res, rej) => {
    let input: string = ''
    process.stdin.on('data', (chunk) => (input += chunk))
    process.stdin.on('end', () => {
      res(input)
    })
    process.stdin.on('error', (err) => {
      rej(err)
    })
  })
}
