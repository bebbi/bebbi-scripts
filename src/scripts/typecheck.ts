import spawn from 'cross-spawn'
import yargsParser from 'yargs-parser'
import { /* hasAnyDep, */ resolveBin, hasFile, log } from '..'

console.log('Running `bebbi-scripts typecheck`, Please wait...')

let args = process.argv.slice(2).filter((f) => f !== '--no-banner')
const parsedArgs = yargsParser(args)

// if (!hasAnyDep('typescript')) {
//   throw new Error(
//     'Cannot use the "typecheck" script in a project that does not have typescript listed as a dependency (or devDependency). ' +
//       'Please install typescript first with `yarn add -D typescript`'
//   )
// }

if (!parsedArgs.project && !parsedArgs.build && !hasFile('tsconfig.json')) {
  log.error(
    'Cannot use the "typecheck" script without --project or --build in a project that does not have a tsconfig.json file.',
  )
  process.exit(1)
}

// if --project is provided, we can't pass --build
// if --build is provided, we don't need to add it
// if --no-build is passed, we'll just trust they know what they're doing
if (!parsedArgs.project && !parsedArgs.build && !parsedArgs.noBuild) {
  args = ['--build', ...args]
}

const result = spawn.sync(
  resolveBin('typescript', { executable: 'tsc' }),
  args,
  {
    stdio: 'inherit',
  },
)

process.exit(result.status ?? 0)
