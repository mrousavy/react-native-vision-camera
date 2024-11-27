"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _Camera = require("./Camera");
Object.keys(_Camera).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Camera[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Camera[key];
    }
  });
});
var _CameraError = require("./CameraError");
Object.keys(_CameraError).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _CameraError[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _CameraError[key];
    }
  });
});
var _CameraDevice = require("./types/CameraDevice");
Object.keys(_CameraDevice).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _CameraDevice[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _CameraDevice[key];
    }
  });
});
var _CameraProps = require("./types/CameraProps");
Object.keys(_CameraProps).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _CameraProps[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _CameraProps[key];
    }
  });
});
var _Frame = require("./types/Frame");
Object.keys(_Frame).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Frame[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Frame[key];
    }
  });
});
var _Orientation = require("./types/Orientation");
Object.keys(_Orientation).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Orientation[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Orientation[key];
    }
  });
});
var _OutputOrientation = require("./types/OutputOrientation");
Object.keys(_OutputOrientation).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _OutputOrientation[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _OutputOrientation[key];
    }
  });
});
var _PhotoFile = require("./types/PhotoFile");
Object.keys(_PhotoFile).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _PhotoFile[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _PhotoFile[key];
    }
  });
});
var _Snapshot = require("./types/Snapshot");
Object.keys(_Snapshot).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Snapshot[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Snapshot[key];
    }
  });
});
var _PixelFormat = require("./types/PixelFormat");
Object.keys(_PixelFormat).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _PixelFormat[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _PixelFormat[key];
    }
  });
});
var _Point = require("./types/Point");
Object.keys(_Point).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Point[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Point[key];
    }
  });
});
var _VideoFile = require("./types/VideoFile");
Object.keys(_VideoFile).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _VideoFile[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _VideoFile[key];
    }
  });
});
var _CodeScanner = require("./types/CodeScanner");
Object.keys(_CodeScanner).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _CodeScanner[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _CodeScanner[key];
    }
  });
});
var _getCameraFormat = require("./devices/getCameraFormat");
Object.keys(_getCameraFormat).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _getCameraFormat[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _getCameraFormat[key];
    }
  });
});
var _getCameraDevice = require("./devices/getCameraDevice");
Object.keys(_getCameraDevice).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _getCameraDevice[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _getCameraDevice[key];
    }
  });
});
var _Templates = require("./devices/Templates");
Object.keys(_Templates).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Templates[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Templates[key];
    }
  });
});
var _useCameraDevice = require("./hooks/useCameraDevice");
Object.keys(_useCameraDevice).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _useCameraDevice[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _useCameraDevice[key];
    }
  });
});
var _useCameraDevices = require("./hooks/useCameraDevices");
Object.keys(_useCameraDevices).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _useCameraDevices[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _useCameraDevices[key];
    }
  });
});
var _useCameraFormat = require("./hooks/useCameraFormat");
Object.keys(_useCameraFormat).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _useCameraFormat[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _useCameraFormat[key];
    }
  });
});
var _useCameraPermission = require("./hooks/useCameraPermission");
Object.keys(_useCameraPermission).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _useCameraPermission[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _useCameraPermission[key];
    }
  });
});
var _useCodeScanner = require("./hooks/useCodeScanner");
Object.keys(_useCodeScanner).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _useCodeScanner[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _useCodeScanner[key];
    }
  });
});
var _useFrameProcessor = require("./hooks/useFrameProcessor");
Object.keys(_useFrameProcessor).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _useFrameProcessor[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _useFrameProcessor[key];
    }
  });
});
var _runAsync = require("./frame-processors/runAsync");
Object.keys(_runAsync).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _runAsync[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _runAsync[key];
    }
  });
});
var _runAtTargetFps = require("./frame-processors/runAtTargetFps");
Object.keys(_runAtTargetFps).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _runAtTargetFps[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _runAtTargetFps[key];
    }
  });
});
var _VisionCameraProxy = require("./frame-processors/VisionCameraProxy");
Object.keys(_VisionCameraProxy).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _VisionCameraProxy[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _VisionCameraProxy[key];
    }
  });
});
var _useSkiaFrameProcessor = require("./skia/useSkiaFrameProcessor");
Object.keys(_useSkiaFrameProcessor).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _useSkiaFrameProcessor[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _useSkiaFrameProcessor[key];
    }
  });
});
//# sourceMappingURL=index.js.map