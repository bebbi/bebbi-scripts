#!/usr/bin/env node
import { run } from './run'

const [executor, , script] = process.argv

run(executor, script)
