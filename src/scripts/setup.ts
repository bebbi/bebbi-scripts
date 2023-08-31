import { SpawnSyncReturns } from 'child_process'
import fs from 'fs'
import spawn from 'cross-spawn'
import { fromRoot, isBebbiScripts, pkg, resolveBin } from '../utils'

const BEBBI_EXTENDS = 'bebbi-scripts/extend.tsconfig.json'

const SCRIPTS = {
  clean: 'bebbi-scripts clean',
  build: 'bebbi-scripts build',
  watch: 'bebbi-scripts cjs --watch',
  test: 'bebbi-scripts test',
  format: 'bebbi-scripts format',
  lint: 'bebbi-scripts lint',
  validate: 'bebbi-scripts validate',
  prepare: 'husky install',
}

console.log('Running `bebbi-scripts setup`, Please wait...')

if (isBebbiScripts()) {
  throw new Error('🚫 Run this setup script from parent packages only!')
}

const hasGit = fs.existsSync('.git')

const initYarnConfig = async () => {
  return new Promise<boolean>((res, rej) => {
    const yarnConfigPath = fromRoot('.yarnrc.yml')
    if (fs.existsSync(yarnConfigPath)) {
      fs.readFile(yarnConfigPath, { encoding: 'utf8' }, (err, data) => {
        if (err) return rej(err)
        let nodeLinkerFound = false
        let errMsg: string = ''
        const lines = data.split('\n').map((line) => {
          if (line.startsWith('nodeLinker:')) {
            if (!line.includes('node-modules')) {
              errMsg =
                '🚫 A `.yarnrc.yml` config file was found with an unsupported `nodeLinker` value. Only node-modules is supported at the time.'
            }
            nodeLinkerFound = true
          }
          return line
        })

        if (errMsg) {
          throw new Error(errMsg)
        }
        /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
        if (!nodeLinkerFound) lines.push('nodeLinker: node-modules')
        fs.writeFileSync(yarnConfigPath, lines.join('\n'), {
          encoding: 'utf-8',
        })
        res(true)
      })
    } else {
      fs.writeFile(
        yarnConfigPath,
        'nodeLinker: node-modules',
        { encoding: 'utf-8' },
        (err) => {
          if (err) return rej(err)
          return res(true)
        },
      )
    }
  })
}

function initHusky(): boolean {
  const installScripts: SpawnSyncReturns<Buffer>[] = [
    spawn.sync(resolveBin('yarn'), ['add', '-D', 'husky'], {
      stdio: 'inherit',
    }),
  ]

  hasGit &&
    installScripts.push(
      spawn.sync(resolveBin('yarn'), ['dlx', 'husky-init', '--yarn3'], {
        stdio: 'inherit',
      }),
    )

  if (installScripts.some((r) => r.status !== 0)) {
    throw new Error('🚫 husky installation failed.')
  }

  if (hasGit) {
    try {
      fs.writeFileSync(
        fromRoot('.husky/pre-commit'),
        [
          '#!/usr/bin/env sh',
          '. "$(dirname -- "$0")/_/husky.sh"',
          '',
          'yarn bebbi-scripts pre-commit',
          '',
        ].join('\n'),
        { encoding: 'utf-8' },
      )
    } catch (err) {
      throw new Error('🚫 Writing husky pre-commit script failed.')
    }
  }

  return true
}

function addPkgJsonScripts() {
  const data = fs.readFileSync('package.json', { encoding: 'utf-8' })

  let pkgJSON: typeof pkg

  if (!data) {
    throw new Error('🚫 `package.json` appears empty')
  }

  try {
    // typeof pkg = Something | undefined
    pkgJSON = (JSON.parse(data) as typeof pkg)!
  } catch (e: unknown) {
    throw new Error('🚫 Could not parse package.json as json')
  }

  pkgJSON.scripts = pkgJSON.scripts ?? {}

  Object.entries(SCRIPTS).forEach(([key, value]) => {
    // TODO: TS assert shouldn't be needed
    const val = pkgJSON!.scripts![key]
    if (val) {
      console.warn(`⚠️ Skipping existing script key ${key}`)
      return
    }
    console.log(`✅ Adding script key ${key}`)
    pkgJSON!.scripts![key] = value
  })

  try {
    fs.writeFileSync('package.json', JSON.stringify(pkgJSON, undefined, 2))
  } catch (err) {
    throw new Error('🚫 Failed to write to package.json')
  }

  return true
}

async function initScriptsConfig(): Promise<boolean> {
  const installPkgJson: SpawnSyncReturns<Buffer>[] = []

  // If no package.json exists, create it in cwd.
  if (!fs.existsSync('package.json')) {
    installPkgJson.push(
      spawn.sync(resolveBin('yarn'), ['init'], { stdio: 'inherit' }),
    )
  }

  // This fails for extend-config packages which for now we accept.
  installPkgJson.push(
    spawn.sync(resolveBin('yarn'), ['add', '-D', 'bebbi-scripts'], {
      stdio: 'inherit',
    }),
  )

  if (installPkgJson.some((r) => r.status !== 0)) {
    throw new Error('🚫 Some package.json installation scripts failed.')
  }

  const success1 = addPkgJsonScripts()
  const success2 = initHusky()

  return success1 && success2
}

function initTsConfig(): boolean {
  const tsConfigPath = fromRoot('tsconfig.json')

  let tsConfig: Record<string, unknown> | undefined

  if (fs.existsSync(tsConfigPath)) {
    const data = fs.readFileSync(tsConfigPath, { encoding: 'utf-8' })

    if (!data) {
      throw new Error('🚫 Empty tsconfig.json found.')
    }

    try {
      tsConfig = JSON.parse(data) as Record<string, unknown>
    } catch (err) {
      throw new Error('🚫 Could not read tsconfig.json (invalid json?)')
    }
  }

  if (tsConfig) {
    if (tsConfig.extends === BEBBI_EXTENDS) {
      return true
    } else {
      console.log(
        'We recommend that your tsconfig.json file extends the bebbi-scripts file like this:\n',
        '        `{\n',
        `           "extends": "${BEBBI_EXTENDS}"\n`,
        '           [additional configuration]\n',
        '         }`\n',
      )
      return false
    }
  } else {
    tsConfig = { extends: BEBBI_EXTENDS }
    try {
      fs.writeFileSync(
        tsConfigPath,
        `${JSON.stringify(tsConfig, undefined, 2)}\n`,
        { encoding: 'utf-8' },
      )
    } catch (err) {
      throw new Error('🚫 Writing tsconfig.json failed')
    }
  }

  return true
}

async function run() {
  if (!(await initYarnConfig())) {
    throw new Error('🚫 The yarn config file failed to initialize.')
  }

  if (!(await initScriptsConfig())) {
    throw new Error('🚫 The `package.json` scripts failed to initialize.')
  }

  if (!(await initTsConfig())) {
    console.warn('⚠️ `tsconfig.json` unchanged.')
  }

  console.log(
    hasGit
      ? console.log('✅ husky git hooks installed')
      : console.warn('⚠️ Missing .git: skipping husky git hooks'),
  )

  process.exit(0)
}

run()
