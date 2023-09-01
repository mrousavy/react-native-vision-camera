//
// Created by Marc Rousavy on 29.08.23.
//

#include "OpenGLRenderer.h"

#include <EGL/egl.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>

#include <android/log.h>
#include <android/native_window.h>

#include <utility>

#include "OpenGLError.h"

namespace vision {

std::unique_ptr<OpenGLRenderer> OpenGLRenderer::CreateWithWindowSurface(std::shared_ptr<OpenGLContext> context, ANativeWindow* surface) {
  return std::unique_ptr<OpenGLRenderer>(new OpenGLRenderer(std::move(context), surface));
}

OpenGLRenderer::OpenGLRenderer(std::shared_ptr<OpenGLContext> context, ANativeWindow* surface) {
  _context = std::move(context);
  _outputSurface = surface;
  _width = ANativeWindow_getWidth(surface);
  _height = ANativeWindow_getHeight(surface);
}

OpenGLRenderer::~OpenGLRenderer() {
  if (_outputSurface != nullptr) {
    ANativeWindow_release(_outputSurface);
  }
  destroy();
}

void OpenGLRenderer::destroy() {
  if (_context != nullptr && _surface != EGL_NO_DISPLAY) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Surface...");
    eglDestroySurface(_context->display, _surface);
    _surface = EGL_NO_SURFACE;
  }
}

void OpenGLRenderer::renderTextureToSurface(const OpenGLTexture& texture, float* transformMatrix) {
  if (_surface == EGL_NO_SURFACE) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Creating Window Surface...");
    _context->use();
    _surface = eglCreateWindowSurface(_context->display, _context->config, _outputSurface, nullptr);
  }

  // 1. Activate the OpenGL context for this surface
  _context->use(_surface);

  // 2. Set the viewport for rendering
  glViewport(0, 0, _width, _height);
  glDisable(GL_BLEND);

  // 3. Bind the input texture
  glBindTexture(texture.target, texture.id);
  glTexParameteri(texture.target, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(texture.target, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glTexParameteri(texture.target, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri(texture.target, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

  // 4. Draw it using the pass-through shader which also applies transforms
  _passThroughShader.draw(texture, transformMatrix);

  // 5. Swap buffers to pass it to the window surface
  eglSwapBuffers(_context->display, _surface);
}

} // namespace vision
