module.exports = [
  "api/index",
  "api/modules",
  {
    "type": "category",
    "label": "Modules",
    "items": [
      "api/modules/camera",
      "api/modules/cameracodec",
      "api/modules/cameradevice",
      "api/modules/cameraerror",
      "api/modules/cameraposition",
      "api/modules/camerapreset",
      "api/modules/code",
      "api/modules/photofile",
      "api/modules/point",
      "api/modules/snapshot",
      "api/modules/temporaryfile",
      "api/modules/videofile",
      "api/modules/hooks_usecameradevices",
      "api/modules/hooks_usecameraformat",
      "api/modules/utils_formatfilter"
    ]
  },
  {
    "type": "category",
    "label": "Classes",
    "items": [
      "api/classes/camera.camera-1",
      "api/classes/cameraerror.cameracaptureerror",
      "api/classes/cameraerror.cameraruntimeerror"
    ]
  },
  {
    "type": "category",
    "label": "Interfaces",
    "items": [
      "api/interfaces/cameraerror.errorwithcause",
      "api/interfaces/photofile.takephotooptions",
      "api/interfaces/point.point-1",
      "api/interfaces/snapshot.takesnapshotoptions",
      "api/interfaces/videofile.recordvideooptions"
    ]
  }
];