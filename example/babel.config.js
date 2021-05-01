/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const pak = require('../package.json');

module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__exampleSwift___scanQRCodes', '__exampleObjC___scanQRCodes'],
      },
    ],
    [
      'module-resolver',
      {
        alias: {
          [pak.name]: path.join(__dirname, '..', pak.source),
        },
      },
    ],
  ],
};
