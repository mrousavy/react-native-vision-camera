const path = require('path').join(__dirname, '../package');

/** 
 * @type {import("@react-native-community/cli-types").Config}
 */
module.exports = {
  dependencies: {
    // Note: we don't need to do this but otherwise the path in XCode will be super long like ../../../node_modules/react-native-vision-camera/...
    'react-native-vision-camera': {
      root: path
    }
  }
};
