<div align="center">
<h1>bebbi-scripts 🛠📦</h1>

<p>CLI toolbox for common project scripts</p>
</div>

## What

Maintain library projects.

Commands for `setup`, `validate`, `test`, `lint`, `format`, `build`.

Like kcd-scripts, but

✅ written in TS<br />
✅ builds using tsc<br />
✅ outputs esm, cjs, types<br />
✅ yarn 3<br />
✅ yarn monorepo<br />
🚫 yarn pnp<br />
🚫 npm

## How

1. Have a `.yarnrc.yml` config file containing:

```
nodeLinker: node-modules
```

2. Inside your new workspace folder, run

```sh
yarn dlx bebbi-scripts setup
```

### Overriding Config

Same approach as [kcd-scripts](https://github.com/kentcdodds/kcd-scripts#overriding-config), but also extends to `tsconfig.json`

Run `bebbi-scripts setup` for tips on extending your `tsconfig.json`.

If you have a `typecheck` script (normally set to `bebbi-scripts typecheck`)
that will be run as part of the `validate` script (which is run as part of the `pre-commit` script as well).

## Inspiration

[kcd-scripts](https://github.com/kentcdodds/kcd-scripts) and [react-scripts](https://github.com/facebook/create-react-app/tree/main/packages/react-scripts).

## 💡 Bugs and Features

Help us by adding pull requests to issues!

## License

MIT
