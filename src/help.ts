import { bebbiArt } from './bebbiArt'
import { availableScriptNames } from './utils'

const [, ignoredBin] = process.argv

export const help = () => {
  const scriptsAvailableMessage = availableScriptNames().join('\n  ').trim()
  const fullMessage = `
${bebbiArt}
Usage: ${ignoredBin} [] [--flags]

Available Scripts:
  ${scriptsAvailableMessage}
`
  console.log(`\n${fullMessage}\n`)
}
