//
// Created by Marc Rousavy on 10.08.23.
//

#pragma once

#include <GLES2/gl2.h>
#include <EGL/egl.h>
#include <include/core/SkSurface.h>
#include <android/native_window.h>

namespace vision {

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

class SkiaRenderer {
 public:
  explicit SkiaRenderer(ANativeWindow* previewSurface);
  ~SkiaRenderer();

  int createTexture() const;
  void drawFrame();
  void ensureOpenGL() const;

 private:
  OpenGLContext _gl;
  SkiaContext _skia;
  PassThroughShader _shader;
  ANativeWindow* _previewSurface;

  static OpenGLContext createOpenGLContext(ANativeWindow* previewSurface);

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
