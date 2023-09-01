import path from 'path'
import { sync } from 'cross-spawn'
import { trimNewlines } from './utils'

import {
  attemptResolve,
  getEnv,
  handleSignal,
  availableScriptNames,
  getScriptsDir,
  extractErrorMsg,
} from './utils'
import { signOff } from './bebbiArt'

export const spawnScript = (
  executor: string,
  script: string,
  dirname: string = __dirname,
) => {
  const args = process.argv.slice(2)

  const noBanner = args.some((f) => f === '--no-banner')

  const scriptIndex = args.findIndex((x) =>
    availableScriptNames(dirname).includes(x),
  )
  const buildCommand = scriptIndex === -1 ? args[0] : args[scriptIndex]
  const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : []
  if (!buildCommand) {
    throw new Error(`Unknown script "${script}".`)
  }

  const relativeScriptPath = path.join(getScriptsDir(dirname), buildCommand)
  const scriptPath = attemptResolve(relativeScriptPath)
  if (!scriptPath) {
    throw new Error(`Unknown script "${script}".`)
  }

  const result = sync(
    executor,
    nodeArgs.concat(scriptPath).concat(args.slice(scriptIndex + 1)),
    {
      stdio: ['inherit', 'inherit', 'pipe'],
      env: getEnv(script),
    },
  )
  if (result.signal) {
    handleSignal(script, result)
  } else {
    if (result.status) {
      const error = trimNewlines(result.stderr?.toString()) ?? ''

      const maybeUserError = extractErrorMsg(error)

      if (!maybeUserError) {
        console.error(`🚫 The script exited with a non-zero error status.\n`)
      }

      if (maybeUserError || error) {
        console.error('\n' + (maybeUserError ?? error))
      }
    }

    !result.status && !noBanner && signOff()

    process.exit(result.status ?? 0)
  }
}
