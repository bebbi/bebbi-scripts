const {resolveBebbiScripts} = require('../utils')

const bebbiScripts = resolveBebbiScripts()

module.exports = {
  hooks: {
    'pre-commit': `"${bebbiScripts}" pre-commit`,
  },
}
