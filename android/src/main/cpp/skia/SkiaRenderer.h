//
// Created by Marc Rousavy on 10.08.23.
//

#pragma once

#include <GLES2/gl2.h>
#include <EGL/egl.h>
#include <include/core/SkSurface.h>

namespace vision {

struct OpenGLContext {
  EGLDisplay display;
  EGLContext context;
  EGLConfig config;
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
  explicit SkiaRenderer();
  ~SkiaRenderer();

  int createTexture() const;
  void drawFrame();

 private:
  OpenGLContext _gl;
  SkiaContext _skia;
  PassThroughShader _shader;

  static OpenGLContext createOpenGLContext();
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
