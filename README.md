# Uh!ive JS SDK

[![CircleCI](https://circleci.com/gh/uhlive/javascript-sdk/tree/production.svg?style=svg)](https://circleci.com/gh/uhlive/javascript-sdk/tree/production)

The uh!ive JS SDK provides convenient access to the uh!ive API from applications written in the JavaScript language. Only browsers are supported, not Node.js applications.

Read the [documentation for the Conversation API](https://docs.allo-media.net/live-api/) and [for the Recognition API (vocal bot toolkit)](https://docs.allo-media.net/stream-api-bots/).

## Requirements

As specified in the `.tool-versions` and `package.json` files, you need the following versions of Node and npm:

- nodejs 16.13.1
- npm 8.1.2

Note that you must have a token and an identifier to use this package.

### Installation

```text
npm install @uhlive/javascript-sdk
```

### Microphone

This SDK needs you to use a microphone as an input for audio. Importation of audio files is not supported.

## Usage

The easiest way to start is to run the examples provided in the `./node_modules/@uhlive/javascript-sdk/examples/` folder.
You can also find them on the [Github @uhlive/javascript-sdk repository](https://github.com/uhlive/javascript-sdk/tree/production/examples).

Note that you **must** create a `settings.js` file, based on `settings.js.dist`, and change the identifier and token to match yours.

Start the example:

```text
cd ./examples/basic/
npm ci
npm run dev
```

It will print a local URL on which the local server is accessible.

The first time your run the example, your browser will ask for your permission to access your microphone. You must accept it for the SDK to work.

Just speak, and *voilà*!

You can find a more advanced example in `./examples/advanced/`, and go check the [documentation](https://docs.allo-media.net/live-api/javascript/getting-started/#getting-started) for more information and the [API reference](https://docs.allo-media.net/live-api/javascript/api-reference/#api-reference) for technical details.

## Tests

```text
npm test
```
