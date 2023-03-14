import isCI from 'is-ci'
import { run } from 'jest'
import { hasFile, hasPkgProp, parseEnv } from '../utils'
import { jestConfig } from '../config/jest.config'

console.log('Running `bebbi-scripts test`, Please wait...')

process.env.NODE_ENV = 'test'

const args = process.argv.slice(2).filter((f) => f !== '--no-banner')

const watch =
  !isCI &&
  !parseEnv('SCRIPTS_PRE_COMMIT', false) &&
  !args.includes('--no-watch') &&
  !args.includes('--coverage') &&
  !args.includes('--updateSnapshot')
    ? ['--watch']
    : []

const config =
  !args.includes('--config') &&
  !hasFile('jest.config.js') &&
  !hasFile('jest.config.ts') &&
  !hasPkgProp('jest')
    ? ['--config', JSON.stringify(jestConfig)]
    : []

run([...config, ...watch, ...args])
  .then(() => {})
  .catch(() => {})
