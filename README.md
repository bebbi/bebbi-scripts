<div align="center">
<h1>bebbi-scripts 🛠📦</h1>

<p>CLI toolbox for common scripts for my projects</p>
</div>

---

<!-- prettier-ignore-start -->
[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![version][version-badge]][package]
[![downloads][downloads-badge]][npmtrends]
[![MIT License][license-badge]][license]
[![All Contributors][all-contributors-badge]](#contributors-)
[![PRs Welcome][prs-badge]][prs]
[![Code of Conduct][coc-badge]][coc]
<!-- prettier-ignore-end -->

## The problem

I do a bunch of open source and want to make it easier to maintain so many
projects.

## This solution

This is a CLI that abstracts away all configuration for my open source projects
for linting, testing, building, and more.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Usage](#usage)
  - [Overriding Config](#overriding-config)
  - [TypeScript Support](#typescript-support)
- [Inspiration](#inspiration)
- [Other Solutions](#other-solutions)
- [Issues](#issues)
  - [🐛 Bugs](#-bugs)
  - [💡 Feature Requests](#-feature-requests)
- [Contributors ✨](#contributors-)
- [LICENSE](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and
should be installed as one of your project's `devDependencies`:

```
yarn add --save-dev bebbi-scripts
```

Note: `bebbi-scripts` does not support yarn pnp at this time. If you are using
yarn 3 (berry), you will need to create a `.yarnrc.yml` config file in your
package root containing:

```
nodeLinker: node-modules
```

## Usage

This is a CLI and exposes a bin called `bebbi-scripts`. I don't really plan on
documenting or testing it super duper well because it's really specific to my
needs. You'll find all available scripts in `src/scripts`.

This project actually dogfoods itself. If you look in the `package.json`, you'll
find scripts with `node dist {scriptName}`. This serves as an example of some of
the things you can do with `bebbi-scripts`.

NOTE: This package does not dogfood the build command because it is a typescript
project now, and therefore it cannot run the commonjs script before it builds
itself. So the build script in this `package.json` is specific to building the
compiled distributed package itself, while the build script compiled to
`dist/scripts` is available to use in parent projects that use this package.

### Overriding Config

Unlike `react-scripts`, `bebbi-scripts` allows you to specify your own
configuration for things and have that plug directly into the way things work
with `bebbi-scripts`. There are various ways that it works, but basically if you
want to have your own config for something, just add the configuration and
`bebbi-scripts` will use that instead of it's own internal config. In addition,
`bebbi-scripts` exposes its configuration so you can use it and override only
the parts of the config you need to.

This can be a very helpful way to make editor integration work for tools like
ESLint which require project-based ESLint configuration to be present to work.

So, if we were to do this for ESLint, you could create an `.eslintrc` with the
contents of:

```
{"extends": "./node_modules/bebbi-scripts/eslint.js"}
```

> Note: for now, you'll have to include an `.eslintignore` in your project until
> [this eslint issue is resolved](https://github.com/eslint/eslint/issues/9227).

Or, for `babel`, a `.babelrc` with:

```
{"presets": ["bebbi-scripts/babel"]}
```

Or, for `jest`:

```javascript
const {jest: jestConfig} = require('bebbi-scripts/config')
module.exports = Object.assign(jestConfig, {
  // your overrides here

  // for test written in Typescript, add:
  transform: {
    '\\.(ts|tsx)$': '<rootDir>/node_modules/ts-jest/preprocessor.js',
  },
})
```

> Note: `bebbi-scripts` intentionally does not merge things for you when you
> start configuring things to make it less magical and more straightforward.
> Extending can take place on your terms. I think this is actually a great way
> to do this.

### TypeScript Support

We ❤️ TypeScript! To use these scripts with typescipt you must also:

1. Install `typescript` as a `devDependency` of your project with
   `yarn add -D typescipt`
2. Initialize typescript to generate a `tsconfig.json` file in your project with
   `yarn tsc --init`

`bebbi-scripts` will automatically load any `.ts` and `.tsx` files, including
the default entry point, so you don't have to worry about any rollup
configuration.

If you have a `typecheck` script (normally set to `bebbi-scripts typecheck`)
that will be run as part of the `validate` script (which is run as part of the
`pre-commit` script as well).

## Inspiration

This is inspired by `kcd-scripts` and `react-scripts`.

## Other Solutions

If you are aware of any please [make a pull request][prs] and add it here!
Again, this is a very specific-to-me solution.

- [Rollpkg](https://github.com/rafgraph/rollpkg) - convention over config build
  tool to create packages with TypeScript and Rollup.

## Issues

_Looking to contribute? Look for the [Good First Issue][good-first-issue]
label._

### 🐛 Bugs

Please file an issue for bugs, missing documentation, or unexpected behavior.

[**See Bugs**][bugs]

### 💡 Feature Requests

Please file an issue to suggest new features. Vote on feature requests by adding
a 👍. This helps maintainers prioritize what to work on.

[**See Feature Requests**][requests]
