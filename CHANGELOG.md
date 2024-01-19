## 0.4.4

- adds other package.json script keys
- re-arranges the logs for better visibility
- Windows Powershell/scoop.sh: Building itself works now, but not building other libs,
  perhaps fails at `spawn.sync(resolveBin('concurrently'), ...` 

## 0.4.3

- This hopefully fixes broken paths on windows.
  Tested using Powershell and scoop.sh
- Add lint-staged to init script
- make code compatible for (possibly future) `noUncheckedIndexedAccess`
  and `noPropertyAccessFromIndexSignature`
- Bumps non-ESM deps

## 0.4.2

- Fix a `yarn test` issue with importing libraries.
- Use OS independent path calculation across the board.

## 0.4.1

- Fix husky install in a .git repo that is inside a monorepo

## 0.4.0

- setup becomes init

## 0.3.2

- Allow selecting the config source

## 0.3.0

- Change error handling so test output works again
- configs can also be folders

## 0.2.0

- Bump typescript version to 5.2.2
- More functions accessible from outside
- add types for exports
- Harmonized error handling across scripts
- eslint-config-react-app
- fixed tsconfig.json export

## 0.1.0

- Hello bebbi-scripts
