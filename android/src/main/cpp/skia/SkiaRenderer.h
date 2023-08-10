//
// Created by Marc Rousavy on 10.08.23.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

#include <GLES2/gl2.h>
#include <EGL/egl.h>
#include <include/core/SkSurface.h>
#include <android/native_window.h>

namespace vision {

using namespace facebook;

struct OpenGLContext {
  EGLDisplay display = EGL_NO_DISPLAY;
  EGLContext context = EGL_NO_CONTEXT;
  EGLSurface surface = EGL_NO_SURFACE;
  EGLConfig config = nullptr;
};
struct SkiaContext {
  sk_sp<GrDirectContext> context;
};
struct PassThroughShader {
  GLuint vertexBuffer;
  GLuint program;
  GLint aPosition;
  GLint aTexCoord;
};

class SkiaRenderer: public jni::HybridClass<SkiaRenderer> {
  // JNI Stuff
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/skia/SkiaRenderer;";
  static void registerNatives();
 private:
  friend HybridBase;
  jni::global_ref<SkiaRenderer::javaobject> _javaPart;
  explicit SkiaRenderer(const jni::alias_ref<jhybridobject>& javaPart);

 public:
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> javaPart);
  ~SkiaRenderer();

 private:
  void setPreviewSurface(jobject previewSurface);
  void destroyPreviewSurface();
  void setPreviewSurfaceSize(int width, int height);

  /**
   * Gets the input OpenGL Texture which the Camera can dump Frames into.
   */
  int getInputTexture();
  /**
   * Renders the latest Camera Frame from the Input Texture onto the Preview Surface. (60 FPS)
   */
  void renderLatestFrameToPreview();
  /**
   * Renders the latest Camera Frame into it's Input Texture and run the Skia Frame Processor (1..240 FPS)
   */
  void renderCameraFrameToOffscreenCanvas();

 private:
  OpenGLContext _gl;
  SkiaContext _skia;
  PassThroughShader _shader;
  int _inputTextureId;
  ANativeWindow* _previewSurface;
  int _previewWidth, _previewHeight;

  void ensureOpenGL() const;

  static OpenGLContext createOpenGLContext(ANativeWindow* previewSurface);
  static void destroyOpenGLContext(OpenGLContext& context);

  static PassThroughShader createPassThroughShader();
  static SkiaContext createSkiaContext();

  static auto constexpr TAG = "SkiaRenderer";

  // Pass-through Shader
  static const GLfloat* VertexData();
  static const GLushort* VertexIndices();

  static const char* VertexShaderCode();
  static const char* FragmentShaderCode();

  static GLuint LoadShader(GLenum shaderType, const char* shaderCode);
  static GLuint CreateProgram(const char* vertexShaderCode, const char* fragmentShaderCode);
};

} // namespace vision
