import fs from 'fs'

fs.readdirSync('./src/config/', { encoding: 'utf-8' })
  .filter((file) => file.startsWith('_'))
  .forEach((file) => {
    fs.copyFileSync(
      `./src/config/${file}`,
      `./dist/cjs/config/${file.substring(1)}`,
    )
  })
