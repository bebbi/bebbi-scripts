import path from 'path'
import spawn from 'cross-spawn'
import { hasPkgProp, hasFile, resolveBin, toRelative } from '../utils'

console.log('Running `bebbi-scripts pre-commit`, Please wait...')

const here = (p: string) => path.join(__dirname, p)

const args = process.argv.slice(2).filter((f) => f !== '--no-banner')

const useBuiltInConfig =
  !args.includes('--config') &&
  !hasFile('.lintstagedrc') &&
  !hasFile('lint-staged.config.js') &&
  !hasPkgProp('lint-staged')

const config = useBuiltInConfig
  ? ['--config', toRelative(here('../config/lintstagedrc.js'))]
  : []

const go = () => {
  let result

  result = spawn.sync(resolveBin('lint-staged'), [...config, ...args], {
    stdio: 'inherit',
  })

  if (result.status !== 0) return result.status ?? undefined

  result = spawn.sync('yarn', ['validate', '--no-banner'], {
    stdio: 'inherit',
  })

  return result.status ?? 0
}

process.exit(go())
