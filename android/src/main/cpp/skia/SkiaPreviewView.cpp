//
// Created by Marc Rousavy on 09.08.23.
//

#include "SkiaPreviewView.h"
#include <GLES2/gl2.h>
#include <EGL/egl.h>
#include <android/native_window.h>
#include <android/native_window_jni.h>

namespace vision {

jni::local_ref<SkiaPreviewView::jhybriddata> SkiaPreviewView::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void SkiaPreviewView::initOpenGL() {
  _display = eglGetDisplay(EGL_DEFAULT_DISPLAY);
  if (_display == EGL_NO_DISPLAY) throw OpenGLError("Failed to create default EGL Display!");

  EGLint majorVersion, minorVersion;
  bool successful = eglInitialize(_display, &majorVersion, &minorVersion);
  if (!successful) throw OpenGLError("Failed to initialize OpenGL!");

  EGLint attributes[] = {EGL_RENDERABLE_TYPE,
                         EGL_OPENGL_ES2_BIT,
                         EGL_SURFACE_TYPE,
                         EGL_PBUFFER_BIT,
                         EGL_ALPHA_SIZE,
                         8,
                         EGL_BLUE_SIZE,
                         8,
                         EGL_GREEN_SIZE,
                         8,
                         EGL_RED_SIZE,
                         8,
                         EGL_DEPTH_SIZE,
                         0,
                         EGL_STENCIL_SIZE,
                         0,
                         EGL_NONE};
  EGLConfig config = nullptr;
  EGLint numConfigs = 0;
  successful = eglChooseConfig(_display, attributes, &config, 1, &numConfigs);
  if (!successful || numConfigs == 0) throw OpenGLError("Failed to choose an OpenGL config!");

  // TODO: Can we use OpenGL 3?
  EGLint contextAttributes[] = {EGL_CONTEXT_CLIENT_VERSION, 2, EGL_NONE};

  _context = eglCreateContext(_display, config, nullptr, contextAttributes);
  if (_context == EGL_NO_CONTEXT) throw OpenGLError("Failed to create OpenGL context!");
}

int SkiaPreviewView::createTexture() {
  eglMakeCurrent(_display, EGL_NO_SURFACE, EGL_NO_SURFACE, _context);

  GLuint textures[1];
  glGenTextures(1, textures);
  if (glGetError() != GL_NO_ERROR) throw OpenGLError("Failed to generate an OpenGL Texture!");
  return static_cast<int>(textures[0]);
}

void SkiaPreviewView::destroyTexture(int textureId) {
  eglMakeCurrent(_display, EGL_NO_SURFACE, EGL_NO_SURFACE, _context);

  GLuint textures[1];
  textures[0] = textureId;
  eglDestroySurface(_display, textures);
}

void SkiaPreviewView::destroy() {
  destroyPreviewSurface();

  if (_display != nullptr || _context != nullptr) {
    eglMakeCurrent(_display, EGL_NO_SURFACE, EGL_NO_DISPLAY, EGL_NO_CONTEXT);
    eglDestroyContext(_display, _context);
    _context = nullptr;
    eglReleaseThread();
    eglTerminate(_display);
    _display = nullptr;
  }
}

void SkiaPreviewView::onDrawFrame() {
  glClearColor(1.0f, 0.0f, 0.0f, 1.0f);  // Clear the screen with black color
  glClear(GL_COLOR_BUFFER_BIT);
}

void SkiaPreviewView::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", SkiaPreviewView::initHybrid),
    makeNativeMethod("initOpenGL", SkiaPreviewView::initOpenGL),
    makeNativeMethod("destroy", SkiaPreviewView::destroy),
    makeNativeMethod("createTexture", SkiaPreviewView::createTexture),
    makeNativeMethod("destroyTexture", SkiaPreviewView::destroyTexture),
    makeNativeMethod("onDrawFrame", SkiaPreviewView::onDrawFrame),
  });
}



std::string getEglErrorIfAny() {
  EGLint error = eglGetError();
  if (error == GL_NO_ERROR) return "";
  return " Error: " + std::to_string(error);
}
OpenGLError::OpenGLError(const std::string&& message): std::runtime_error(message + getEglErrorIfAny()) {}

} // namespace vision
