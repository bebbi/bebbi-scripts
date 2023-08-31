import { SpawnSyncReturns } from 'child_process'
import fs from 'fs'
import spawn from 'cross-spawn'
import { fromRoot, isBebbiScripts, pkg, pkgPath, resolveBin } from '../utils'

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
  console.log('ERROR: Run this setup script from parent packages only!')
  process.exit(1)
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
                'A `.yarnrc.yml` config file was found with an incompatible nodeLinker value. This script only supports `node-modules` at this time.'
            }
            nodeLinkerFound = true
          }
          return line
        })
        if (errMsg) return rej(errMsg)
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
    console.log('ERROR: husky installation failed.')
    return false
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
      console.log('ERROR: writing husky pre-commit failed.')
      return false
    }
  }

  return true
}

function addPkgJsonScripts() {
  const data = fs.readFileSync('package.json', { encoding: 'utf-8' })

  let pkgJSON: typeof pkg

  if (!data) {
    console.log('ERROR: empty `package.json` found')
    return false
  }

  try {
    // typeof pkg = Something | undefined
    pkgJSON = (JSON.parse(data) as typeof pkg)!
  } catch (e: unknown) {
    console.log('ERROR: could not parse package.json')
    return false
  }

  pkgJSON.scripts = pkgJSON.scripts ?? {}

  Object.entries(SCRIPTS).forEach(([key, value]) => {
    // TODO: TS assert shouldn't be needed
    const val = pkgJSON!.scripts![key]
    if (val) {
      console.log(`🚫 Skipping existing script key ${key}`)
      return
    }
    console.log(`✅ Adding script key ${key}`)
    pkgJSON!.scripts![key] = value
  })

  try {
    fs.writeFileSync('package.json', JSON.stringify(pkgJSON, undefined, 2))
  } catch (err) {
    console.log('ERROR: Could not add scripts to package.json')
    return false
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

  installPkgJson.push(
    spawn.sync(resolveBin('yarn'), ['add', '-D', 'bebbi-scripts'], {
      stdio: 'inherit',
    }),
  )

  if (installPkgJson.some((r) => r.status !== 0)) {
    console.log('ERROR: Some package.json installation scripts failed.')
    return false
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
      console.log('ERROR: Empty tsconfig.json found.')
      return false
    }

    try {
      tsConfig = JSON.parse(data) as Record<string, unknown>
    } catch (err) {
      console.log('ERROR: Could not read tsconfig.json (invalid json?)')
      return false
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
      console.log('ERROR: Writing tsconfig.json failed')
      return false
    }
  }

  return true
}

async function run() {
  if (!(await initYarnConfig())) {
    console.log('ERROR: The yarn config file failed to initialize.')
    process.exit(1)
  }

  if (!(await initScriptsConfig())) {
    console.log('ERROR: The `package.json` scripts failed to initialize.')
    process.exit(1)
  }

  if (!(await initTsConfig())) {
    console.log('🚫 WARN: `tsconfig.json` not changed.')
  }

  console.log(
    hasGit
      ? console.log('✅ husky git hooks installed')
      : console.log('🚫 Missing .git: skipping husky git hooks'),
  )

  process.exit(0)
}

run()
