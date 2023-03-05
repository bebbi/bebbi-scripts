import fs from 'fs'
import path from 'path'
import which from 'which'

export const resolveBin = (
  modName: string,
  {executable = modName, cwd = process.cwd()} = {},
) => {
  let pathFromWhich: string = ''
  try {
    pathFromWhich = fs.realpathSync(which.sync(executable))
    if (pathFromWhich.includes('.CMD')) return pathFromWhich
  } catch (_e: unknown) {
    // ignore error
  }
  try {
    const modPkgPath = require.resolve(`${modName}/package.json`)
    const modPkgDir = path.dirname(modPkgPath)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {bin} = require(modPkgPath) as {bin: string | Record<string, string>}
    const binPath = typeof bin === 'string' ? bin : bin[executable]
    const fullPathToBin = path.join(modPkgDir, binPath)
    if (fullPathToBin === pathFromWhich) {
      return executable
    }
    return fullPathToBin.replace(cwd, '.')
  } catch (error: unknown) {
    if (pathFromWhich) {
      return executable
    }
    throw error
  }
}
