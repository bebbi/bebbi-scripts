import spawn from 'cross-spawn'
import {parseEnv, resolveBin, ifScript, getConcurrentlyArgs} from '../utils'

console.log('Running `bebbi-scripts validate`, Please wait...')

const preCommit = parseEnv('SCRIPTS_PRE_COMMIT', false)

const validateScripts = process.argv[2]

const useDefaultScripts = typeof validateScripts !== 'string'

const scripts = useDefaultScripts
  ? {
      build: ifScript('build', 'yarn build', ''),
      lint: preCommit ? '' : ifScript('lint', 'yarn lint', ''),
    }
  : validateScripts.split(',').reduce<Record<string, string>>(
      (scriptsToRun, name) => ({
        ...scriptsToRun,
        [name]: `yarn ${name}`,
      }),
      {},
    )

const scriptCount = Object.values(scripts).filter(Boolean).length

if (scriptCount > 0) {
  const result = spawn.sync(
    resolveBin('concurrently'),
    getConcurrentlyArgs(scripts),
    {stdio: 'inherit'},
  )

  process.exit(result.status ?? undefined)
} else {
  process.exit(0)
}
