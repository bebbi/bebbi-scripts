import path from 'path'
import spawn from 'cross-spawn'
import {hasPkgProp, hasFile, resolveBin} from '../utils'

console.log('Running `bebbi-scripts pre-commit`, Please wait...')

const here = (p: string) => path.join(__dirname, p)
const hereRelative = (p: string) => here(p).replace(process.cwd(), '.')

const args = process.argv.slice(2)

const useBuiltInConfig =
  !args.includes('--config') &&
  !hasFile('.lintstagedrc') &&
  !hasFile('lint-staged.config.js') &&
  !hasPkgProp('lint-staged')

const config = useBuiltInConfig
  ? ['--config', hereRelative('../config/lintstagedrc.js')]
  : []

const go = () => {
  let result

  result = spawn.sync(resolveBin('lint-staged'), [...config, ...args], {
    stdio: 'inherit',
  })

  if (result.status !== 0) return result.status ?? undefined

  result = spawn.sync('yarn', ['validate'], {
    stdio: 'inherit',
  })

  return result.status ?? undefined
}

process.exit(go())
