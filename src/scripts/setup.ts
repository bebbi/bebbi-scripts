import { SpawnSyncReturns } from 'child_process'
import fs from 'fs'
import spawn from 'cross-spawn'
import { fromRoot, isBebbiScripts, pkg, pkgPath, resolveBin } from '../utils'
import readPkgUp from 'read-pkg-up'

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
  process.exit(0)
}

const hasGit = fs.existsSync('.git')
if (!hasGit) {
  console.log('.git missing. NOT installing git hooks for husky.')
}

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

const initHusky = async (): Promise<boolean> => {
  return new Promise(async (res, rej) => {
    const installScripts: SpawnSyncReturns<Buffer>[] = []

    installScripts.push(
      spawn.sync(resolveBin('yarn'), ['add', '-D', 'husky'], {
        stdio: 'inherit',
      }),
    )
    hasGit &&
      installScripts.push(
        spawn.sync(resolveBin('yarn'), ['dlx', 'husky-init', '--yarn3'], {
          stdio: 'inherit',
        }),
      )
    installScripts.push(
      spawn.sync(resolveBin('yarn'), [], {
        stdio: 'inherit',
      }),
    )
    return Promise.all(installScripts)
      .then((result) => {
        if (!result.every((r) => r.status === 0)) {
          return rej('Some install scripts failed.')
        }

        if (hasGit) {
          fs.writeFile(
            fromRoot('.husky/pre-commit'),
            [
              '#!/usr/bin/env sh',
              '. "$(dirname -- "$0")/_/husky.sh"',
              '',
              'yarn bebbi-scripts pre-commit',
              '',
            ].join('\n'),
            { encoding: 'utf-8' },
            (e) => {
              if (e) return rej(e)
              res(true)
            },
          )
        }

        return res(true)
      })
      .catch((e) => rej(e))
  })
}

async function initScriptsConfig(secondRun?: boolean): Promise<boolean> {
  return new Promise<boolean>(async (res, rej) => {
    if (fs.existsSync(pkgPath)) {
      fs.readFile(pkgPath, { encoding: 'utf-8' }, (err, data) => {
        if (err) return rej(err)
        let pkgJSON: typeof pkg

        if (!data) {
          return rej('ERROR: empty `package.json` found')
        }

        try {
          // typeof pkg = Something | undefined
          pkgJSON = (JSON.parse(data) as typeof pkg)!
        } catch (e: unknown) {
          return rej('ERROR: could not parse package.json')
        }

        pkgJSON.scripts = pkgJSON.scripts ?? {}

        Object.values(SCRIPTS).forEach(([key, value]) => {
          // TODO: TS assert shouldn't be needed
          const k = pkgJSON!.scripts![key]
          if (k) {
            console.log(`Skipping existing script key ${k}`)
            return
          }
          pkgJSON!.scripts![key] = value
        })

        try {
          fs.writeFileSync(pkgPath, JSON.stringify(pkgJSON, undefined, 2))
        } catch (err) {
          return rej(err)
        }

        res(true)
      })

      const installScripts: SpawnSyncReturns<Buffer>[] = []

      return Promise.all(installScripts)
        .then(async (result) => {
          if (result.every((r) => r.status === 0)) {
            if (!secondRun) {
              return initScriptsConfig(true).then((comp) => res(comp))
            }
            const comp = await initHusky()
            return res(comp)
          }
          return rej(result)
        })
        .catch((e) => rej(e))
    } else {
      const installScripts: SpawnSyncReturns<Buffer>[] = []
      installScripts.push(
        spawn.sync(resolveBin('yarn'), ['init'], { stdio: 'inherit' }),
      )

      installScripts.push(
        spawn.sync(resolveBin('yarn'), ['add', '-D', 'bebbi-scripts'], {
          stdio: 'inherit',
        }),
      )

      let result

      try {
        result = await Promise.all(installScripts)
      } catch (err) {
        return rej(err)
      }

      if (result.some((r) => r.status === 0)) {
        return rej(result)
      }

      if (!secondRun) {
        const success = await initScriptsConfig(true)
        return res(success)
      }

      const success = await initHusky()
      return res(success)
    }
  })
}

async function initTsConfig(): Promise<boolean> {
  const tsConfigPath = fromRoot('tsconfig.json')

  return new Promise<boolean>((res, rej) => {
    let tsConfig: Record<string, unknown> | undefined

    if (fs.existsSync(tsConfigPath)) {
      const data = fs.readFileSync(tsConfigPath, { encoding: 'utf-8' })

      try {
        tsConfig = JSON.parse(data) as Record<string, unknown>
      } catch (err: unknown) {}
    }

    if (!tsConfig) {
      tsConfig = { extends: BEBBI_EXTENDS }
      fs.writeFile(
        tsConfigPath,
        `${JSON.stringify(tsConfig, undefined, 2)}\n`,
        { encoding: 'utf-8' },
        (e) => {
          if (e) return rej(e)
          res(true)
        },
      )
    } else {
      console.log(
        'We recommend that your tsconfig.json file extends the bebbi-scripts file like this:\n',
        '        `{\n',
        `           "extends": "${BEBBI_EXTENDS}"\n`,
        '           [additional configuration]\n',
        '         }`\n',
      )
      return res(false)
    }
  })
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
    console.log('WARN: `tsconfig.json` not changed.')
    process.exit(1)
  }

  process.exit(0)
}

run()
