import fs from 'fs'
import fsExtra from 'fs-extra'

export function copyConfigs() {
  fs.readdirSync('./src/config/', { encoding: 'utf-8' })
    .filter((name) => name.startsWith('_'))
    .forEach((name) => {
      fsExtra.copySync(
        `./src/config/${name}`,
        `./dist/cjs/config/${name.substring(1)}`,
      )
    })
}
