import fs from 'fs'
import fsExtra from 'fs-extra'

export function copyConfigs(dir: string = './src/config') {
  fs.readdirSync(`${dir}/`, { encoding: 'utf-8' })
    .filter((name) => name.startsWith('_'))
    .forEach((name) => {
      fsExtra.copySync(
        `${dir}/${name}`,
        `./dist/cjs/config/${name.substring(1)}`,
      )
    })
}
