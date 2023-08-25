import spawn from 'cross-spawn'
import { parseEnv, resolveBin, ifScript, getConcurrentlyArgs } from '../utils'

console.log('Running `bebbi-scripts validate`, Please wait...')

const preCommit = parseEnv('SCRIPTS_PRE_COMMIT', false)

const defaultValidateScripts =
  process.argv[2] === '--no-banner' ? undefined : process.argv[2]

const useDefaultScripts = typeof defaultValidateScripts !== 'string'

const validateScripts = useDefaultScripts
  ? {
      build: ifScript('build', 'yarn build --no-banner', ''),
      lint: preCommit ? '' : ifScript('lint', 'yarn lint --no-banner', ''),
    }
  : defaultValidateScripts.split(',').reduce<Record<string, string>>(
      (scriptsToRun, name) => ({
        ...scriptsToRun,
        [name]: `yarn ${name}`,
      }),
      {}
    )

const scriptCount = Object.values(validateScripts).filter(Boolean).length

if (scriptCount > 0) {
  const result = spawn.sync(
    resolveBin('concurrently'),
    getConcurrentlyArgs(validateScripts),
    { stdio: 'inherit' }
  )

  process.exit(result.status ?? undefined)
} else {
  process.exit(0)
}
