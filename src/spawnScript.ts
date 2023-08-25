import path from 'path'
import { sync } from 'cross-spawn'
import {
  attemptResolve,
  getEnv,
  handleSignal,
  availableScriptNames,
  getScriptsDir,
} from './utils'
import { signOff } from './bebbiArt'

export const spawnScript = (
  executor: string,
  script: string,
  dirname: string = __dirname
) => {
  const args = process.argv.slice(2)

  const noBanner = args.some((f) => f === '--no-banner')

  const scriptIndex = args.findIndex((x) => availableScriptNames(dirname).includes(x))
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
      stdio: 'inherit',
      env: getEnv(script),
    }
  )

  if (result.signal) {
    handleSignal(script, result)
  } else {
    if (!noBanner) signOff()
    process.exit(result.status ?? undefined)
  }
}
