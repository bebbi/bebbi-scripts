import jest from 'jest'
import { hasFile, ifAnyDep } from '../utils'

const ignores = [
  '/dist',
  '/node_modules/',
  '/__fixtures__/',
  '/fixtures/',
  '/__tests__/helpers/',
  '/__tests__/utils/',
  '__mocks__',
]

export const jestConfig: jest.Config = {
  preset: 'ts-jest',
  roots: ['<rootDir>/src'],
  testEnvironment: ifAnyDep(
    ['webpack', 'rollup', 'react', 'preact'],
    'jsdom',
    'node',
  ),
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  modulePaths: ['<rootDir>/src', 'shared', '<rootDir>/tests'],
  collectCoverageFrom: ['src/**/*.+(js|jsx|ts|tsx)'],
  testMatch: ['**/*.test.(js|jsx|ts|tsx)'],
  testPathIgnorePatterns: [...ignores],
  coveragePathIgnorePatterns: [...ignores, 'src/(umd|cjs|esm)-entry.js$'],
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  watchPlugins: [
    require.resolve('jest-watch-typeahead/filename'),
    require.resolve('jest-watch-typeahead/testname'),
  ],
  snapshotSerializers: [
    require.resolve('jest-serializer-path'),
    require.resolve('jest-snapshot-serializer-raw/always'),
  ],
}

const setupFiles = [
  'tests/setup-env.js',
  'tests/setup-env.ts',
  'tests/setup-env.tsx',
]

for (const setupFile of setupFiles) {
  if (hasFile(setupFile)) {
    jestConfig.setupFilesAfterEnv = [`<rootDir>/${setupFile}`]
  }
}
