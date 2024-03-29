import { SpawnSyncReturns } from 'child_process'
import fs from 'fs'
import spawn from 'cross-spawn'
import { fromRoot, isBebbiScripts, pkg, resolveBin, log } from '..'

const BEBBI_EXTENDS = 'bebbi-scripts/tsconfig.json'

const PACKAGE_JSON = {
  scripts: {
    clean: 'bebbi-scripts clean',
    build: 'bebbi-scripts build',
    watch: 'bebbi-scripts cjs --watch',
    test: 'bebbi-scripts test',
    format: 'bebbi-scripts format',
    lint: 'bebbi-scripts lint',
    validate: 'bebbi-scripts validate',
  },
  main: 'dist/cjs/index.js',
  module: 'dist/esm/index.js',
  types: 'dist/types/index.d.ts',
  exports: {
    '.': {
      import: './dist/esm/index.js',
      require: './dist/cjs/index.js',
      default: './dist/cjs/index.js',
      development: './src/index.ts',
      production: './dist/cjs/index.js',
    },
  },
  files: ['dist'],
}

console.log('Running `bebbi-scripts init`, Please wait...')

if (isBebbiScripts()) {
  log.error('Run this init script from parent packages only!')
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
                'A `.yarnrc.yml` config file was found with an unsupported `nodeLinker` value. Only node-modules is supported at the time.'
            }
            nodeLinkerFound = true
          }
          return line
        })

        if (errMsg) {
          log.error(errMsg)
          process.exit(1)
        }
        /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
        if (!nodeLinkerFound) lines.push('nodeLinker: node-modules\n')
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
    spawn.sync(resolveBin('yarn'), ['add', '-D', 'husky', 'lint-staged'], {
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
    log.error('Husky installation failed.')
    process.exit(1)
  }

  if (hasGit) {
    try {
      fs.writeFileSync(
        '.husky/pre-commit',
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
      log.error('Writing husky pre-commit script failed.')
      process.exit(1)
    }
  }

  return true
}

function addPkgJsonKeys() {
  const data = fs.readFileSync('package.json', { encoding: 'utf-8' })

  let pkgJSON: typeof pkg

  if (!data) {
    log.error('`package.json` appears empty')
    process.exit(1)
  }

  try {
    // typeof pkg = Something | undefined
    pkgJSON = (JSON.parse(data) as typeof pkg)!
  } catch (e: unknown) {
    log.error('Could not parse package.json as json')
    process.exit(1)
  }

  const { scripts, files, ...rest } = PACKAGE_JSON

  pkgJSON.scripts = pkgJSON.scripts ?? {}

  Object.entries(scripts).forEach(([key, value]) => {
    // TODO: TS assert shouldn't be needed
    const val = pkgJSON!.scripts![key]
    if (val) {
      log.warn(`Skipping existing script key ${key}`)
      return
    }
    log.success(`Adding script key ${key}`)
    pkgJSON!.scripts![key] = value
  })

  pkgJSON.files = pkgJSON.files ?? []

  log.success(`Adding files to files key`)
  pkgJSON.files.push(
    ...files.filter((r) => (pkgJSON!.files as string[]).indexOf(r) === -1),
  )

  Object.entries(rest).forEach(([key, value]) => {
    log.success(`Adding key ${key}`)
    pkgJSON![key] = value
  })

  try {
    fs.writeFileSync('package.json', JSON.stringify(pkgJSON, undefined, 2))
  } catch (err) {
    log.error('Failed to write to package.json')
    process.exit(1)
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
    log.error('Some package.json installation scripts failed.')
    process.exit(1)
  }

  const success = addPkgJsonKeys()

  return success
}

function initTsConfig(): boolean {
  const tsConfigPath = fromRoot('tsconfig.json')

  let tsConfig: Record<string, unknown> | undefined

  if (fs.existsSync(tsConfigPath)) {
    const data = fs.readFileSync(tsConfigPath, { encoding: 'utf-8' })

    if (!data) {
      log.error('Empty tsconfig.json found.')
      process.exit(1)
    }

    try {
      tsConfig = JSON.parse(data) as Record<string, unknown>
    } catch (err) {
      log.error('Could not read tsconfig.json (invalid json?)')
      process.exit(1)
    }
  }

  if (tsConfig) {
    if (tsConfig['extends'] === BEBBI_EXTENDS) {
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

      log.success('Wrote tsconfig.json')
    } catch (err) {
      log.error('Writing tsconfig.json failed')
      process.exit(1)
    }
  }

  return true
}

async function run() {
  if (!(await initYarnConfig())) {
    log.error('The yarn config file failed to initialize.')
    process.exit(1)
  }

  if (!initHusky()) {
    log.error('Husky installation failed.')
  }

  if (!(await initScriptsConfig())) {
    log.error('The `package.json` scripts failed to initialize.')
    process.exit(1)
  }

  if (!(await initTsConfig())) {
    log.warn('`tsconfig.json` unchanged.')
  }

  if (hasGit) {
    log.success('husky git hooks installed')
  } else {
    log.warn('Missing .git: skipping husky git hooks')
  }

  process.exit(0)
}

run()
