#!/usr/bin/env node
import { spawnScript, help, log } from './'

const [executor, , script] = process.argv

if (executor && script && script !== '--help' && script !== 'help') {
  try {
    spawnScript(executor, script)
  } catch (err) {
    if (
      (err as { message: string })?.message?.indexOf('Unknown script') !== -1
    ) {
      log.error(`script "${script}" not found`)
      help()
      process.exit(1)
    } else {
      throw err
    }
  }
} else {
  help()
}
