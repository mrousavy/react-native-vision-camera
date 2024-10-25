const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const path = require('path')

const root = path.resolve(__dirname, '..')

// TODO: remove this once RNWC is published
const fs = require('fs');
const rnwc = fs.realpathSync(path.resolve(root, 'node_modules', 'react-native-worklets-core'))

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [root, rnwc],

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
