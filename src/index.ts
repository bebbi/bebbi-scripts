#!/usr/bin/env node
import { help } from './help'
import { spawnScript } from './spawnScript'

const [executor, , script] = process.argv

if (script && script !== '--help' && script !== 'help') {
  spawnScript(executor, script)
} else {
  help()
}
