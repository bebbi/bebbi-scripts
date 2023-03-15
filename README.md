<div align="center">
<h1>bebbi-scripts 🛠📦</h1>

<p>CLI toolbox for common scripts for my projects</p>
</div>

## The problem

I do a bunch of open source and want to make it easier to maintain so many
projects.

## This solution

This is a CLI that abstracts away all configuration for my open source projects
for linting, testing, building, and more.

This differs from other similar tools like `kcd-scripts` and `create-react-app` in that these scripts are srced in typescript and compiled themselves. This helps keep this script package maintainable and strongly typed with typescript throughout. But more than that is that these scripts does not depend upon babel to compile but rather compiles typescript projects with `tsc` directly. And it continues to use extensions of typescript config files while concurrently building multiple builds of your project to be used for `esm`, `cjs`, and `types` (`umd` builds coming soon). This is the scripting toolset to use if you are building a range of projects from react apps to library packages.

This scripting toolset also favors `yarn` over `npm` and has been developed to work in yarn workspaces too.

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

**NOTE**: This package does not dogfood the build command because it is a
typescript project now, and therefore it cannot run the commonjs script before
it builds itself. So the build script in this `package.json` is specific to
building the compiled distributed package itself, while the build script
compiled to `dist/scripts` is available to use in parent projects that use this
package.

### Overriding Config

Unlike `react-scripts`, `bebbi-scripts` allows you to specify your own
configuration for things and have that plug directly into the way things work
with `bebbi-scripts`. There are various ways that it works, but basically if you
want to have your own config for something, just add the configuration and
`bebbi-scripts` will use that instead of it's own internal config. In addition,
`bebbi-scripts` exposes its configuration so you can use it and override only
the parts of the config you need to.

This can be a very helpful way to make editor integration work for tools like
ESLint which sometimes requires project-based ESLint configuration to be present
to work.

So, if we were to do this for ESLint, you could create an `.eslintrc` with the
contents of:

```
{"extends": "./node_modules/bebbi-scripts/eslint.js"}
```

And then you can add your own config customizations as needed.

### TypeScript Support

We ❤️ TypeScript! This project has been developed with and for Typescript
projects. To use this package you must at bare minimum:

1. Create a `tsconfig.json` file in your project with at least the following
   contents:

```json
{
  "extends": "./node_modules/bebbi-scripts/extend.tsconfig.json"
}
```

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
