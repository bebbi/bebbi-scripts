<div align="center">
<h1>bebbi-scripts 🛠📦</h1>

<p>CLI toolbox for common project scripts</p>
</div>

## What

Maintain library projects.

Commands for `init`, `validate`, `test`, `lint`, `format`, `build`.

Like kcd-scripts, but

✅ written in TS<br />
✅ tsc builds<br />
✅ outputs `esm`, `cjs`, `types`<br />
✅ yarn 3<br />
✅ yarn monorepo<br />
✅ run your own scripts<br />
🚫 yarn pnp<br />
🚫 npm

## How

Inside your new module folder, run

1. `git init` (optional, bebbi-scripts will install pre-commit hooks)

2. `yarn dlx bebbi-scripts init`

### Overriding Config

#### tsconfig.json

```json
{
  "extends": "bebbi-scripts/tsconfig.json",
  "other": "..."
}
```

#### eslint

You can extend the `react-scripts` eslint config which ships with this package.
Example `package.json` section:

```json
{
  "eslintConfig": {
    "extends": ["react-app"],
    "other": "..."
  }
}
```

#### Other

This script adds no babel config. Check out `gig-utils` for a tool that extends `bebbi-scripts` with a config for babel and storybook.

If you have a `typecheck` script (normally set to `bebbi-scripts typecheck`)
that will be run as part of the `validate` script (which is run as part of the `pre-commit` script as well).

## Inspiration

[kcd-scripts](https://github.com/kentcdodds/kcd-scripts)<br/>
[react-scripts](https://github.com/facebook/create-react-app/tree/main/packages/react-scripts)

## 💡 Bugs and Features

Help us by adding pull requests to issues!

## Contributors

[amaster507](https://github.com/amaster507)<br />
[verneleem](https://github.com/verneleem)<br />
[bebbi](https://github.com/bebbi)

## License

MIT
