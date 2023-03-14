import path from 'path'
// eslint-disable-next-line import/no-extraneous-dependencies
import tsconfigJS from 'tsconfig.js'

export const config = async () => {
  return tsconfigJS
    .once({
      root: path.dirname(__dirname),
    })
    .catch((err: unknown) => {
      console.error(err)
    })
}
