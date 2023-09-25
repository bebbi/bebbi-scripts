import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'

export function copyConfigs(dir: string = './src/config') {
  fs.readdirSync(path.normalize(dir), { encoding: 'utf-8' })
    .filter((name) => name.startsWith('_'))
    .forEach((name) => {
      fsExtra.copySync(
        path.join(dir, name),
        path.join('./dist/cjs/config', name.substring(1)),
      )
    })
}
