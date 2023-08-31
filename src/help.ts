import { availableScriptNames } from './utils'

export const help = () => {
  const scriptsAvailableMessage = availableScriptNames().join('\n  ').trim()
  const fullMessage = `Arguments: [script] [--flags]

Available scripts:
  ${scriptsAvailableMessage}
`
  console.log(fullMessage)
}
