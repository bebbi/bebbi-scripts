#!/usr/bin/env node
import { spawnScript, help } from './'

const [executor, , script] = process.argv

if (script && script !== '--help' && script !== 'help') {
  try {
    spawnScript(executor, script)
  } catch (err) {
    if (
      (err as { message: string })?.message?.indexOf('Unknown script') !== -1
    ) {
      console.log(`🚫 script "${script}" not found\n`)
      help()
      process.exit(1)
    } else {
      throw err
    }
  }
} else {
  help()
}
