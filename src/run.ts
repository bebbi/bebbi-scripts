import { help } from './help'
import { spawnScript } from './spawnScript'

export function run(
  executor: string,
  script: string,
  dirname: string = __dirname,
) {
  if (script && script !== '--help' && script !== 'help') {
    try {
      spawnScript(executor, script, dirname)
    } catch (err) {
      if (
        (err as { message: string })?.message?.indexOf('Unknown script') !== -1
      ) {
        console.log(`ERROR: script "${script}" not found\n`)
        help()
        process.exit(1)
      } else {
        throw err
      }
    }
  } else {
    help()
  }
}
