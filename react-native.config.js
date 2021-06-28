module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: "android",
        packageImportPath: "import com.mrousavy.camera.CameraPackage;",
        packageInstance: "new CameraPackage()"
      }
    },
  },
};
