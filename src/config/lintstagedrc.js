const {resolveBebbiScripts, resolveBin} = require('../utils')

const bebbiScripts = resolveBebbiScripts()
const doctoc = resolveBin('doctoc')

module.exports = {
  'README.md': [`${doctoc} --maxlevel 3 --notitle`],
  '*.+(js|jsx|json|yml|yaml|css|less|scss|ts|tsx|md|gql|graphql|mdx|vue)': [
    `${bebbiScripts} format`,
    `${bebbiScripts} lint`,
    `${bebbiScripts} test --findRelatedTests`,
  ],
}
