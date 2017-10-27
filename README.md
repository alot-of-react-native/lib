# @alot/of-react-native

Work with React Native using TypeScript and target more platforms, such as web,
expo, electron.

## What is this repository

This is a monorepo using the tool [Lerna](https://github.com/lerna/lerna).

It contains two packages at the moment:

- [`@alot/transformer`](packages/transformer/README.md)

  A React Native "transformer" that allows using TypeScript (`.ts`, `.tsx`) code
  side-by-side with JavaScript/Flow (`.js`, `.jsx`).

- [`@alot/jest-preset`](packages/jest-preset/README.md)

  A [Jest](https://github.com/facebook/jest) preset for writing tests in
  TypeScript.

## Why TypeScript

TypeScript adds static typing to JavaScript, but as a superset of the language,
it's easy to translate your skills from one to the other. I've found that
languages with strong, descriptive static typing systems help prevent entire
classes of bugs.

If you write a React Native library using these tools, downstream programmers users will benefit from the type discipline in your library. If you write a React Native app using these tools, your users will be less likely to hit "silly" bugs with type conversion errors that occur so often when writing JavaScript.

Get started with [TypeScript in 5 minutes](www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html).