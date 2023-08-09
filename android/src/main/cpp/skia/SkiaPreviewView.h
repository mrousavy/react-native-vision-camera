//
// Created by Marc Rousavy on 09.08.23.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>
#include <EGL/egl.h>
#include <string>
#include "OpenGLError.h"

namespace vision {

using namespace facebook;

class SkiaPreviewView : public jni::HybridClass<SkiaPreviewView> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/mrousavy/camera/skia/SkiaPreviewView;";
  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

 private:
  // JNI Setup
  friend HybridBase;
  jni::global_ref<SkiaPreviewView::javaobject> javaPart_;
  explicit SkiaPreviewView(jni::alias_ref<SkiaPreviewView::jhybridobject> jThis): javaPart_(jni::make_global(jThis)) {}

 private:
  // OpenGL Setup
  EGLDisplay _display;
  EGLContext _context;
  int _surfaceWidth, _surfaceHeight;

  GLuint _vertexBuffer;
  GLuint _program;
  GLint _aPosition;
  GLint _aTexCoord;

  void destroy();

  void onDrawFrame(int texture, int textureWidth, int textureHeight);
  void onSurfaceCreated();
  void setSurfaceSize(int width, int height);

  static const GLfloat* VertexData();
  static const GLushort* VertexIndices();

  static const char* VertexShaderCode();
  static const char* FragmentShaderCode();

  static GLuint LoadShader(GLenum shaderType, const char* shaderCode);
  static GLuint CreateProgram(const char* vertexShaderCode, const char* fragmentShaderCode);
};

} // namespace vision
