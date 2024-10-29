"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.writeToPodfile = writeToPodfile;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function writeToPodfile(projectRoot, key, value) {
  const podfilePath = _path.default.join(projectRoot, 'ios', 'Podfile');
  // get Podfile content as individual lines
  let lines = _fs.default.readFileSync(podfilePath, 'utf8').split('\n');
  // filter out any lines where the given key is already set
  lines = lines.filter(l => !l.includes(key));
  // set the key as the first item in the array so its at the top of the file
  lines.unshift(`${key}=${value}`);

  // write the file back
  const fileContent = lines.join('\n');
  _fs.default.writeFileSync(podfilePath, fileContent, 'utf8');
}
//# sourceMappingURL=writeToPodfile.js.map