import {resolveBebbiScripts} from '../utils'

const bebbiScripts = resolveBebbiScripts()

export const config = {
  hooks: {
    'pre-commit': `"${bebbiScripts}" pre-commit`,
  },
}

exports = config
