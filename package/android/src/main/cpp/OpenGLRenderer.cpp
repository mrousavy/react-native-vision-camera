//
// Created by Marc Rousavy on 29.08.23.
//

#include "OpenGLRenderer.h"

#include <EGL/egl.h>
#include <EGL/eglext.h>
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
  __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGLRenderer...");
  destroy();
  if (_outputSurface != nullptr) {
    ANativeWindow_release(_outputSurface);
  }
}

void OpenGLRenderer::destroy() {
  if (_context != nullptr && _surface != EGL_NO_DISPLAY) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Surface...");
    eglDestroySurface(_context->display, _surface);
    _surface = EGL_NO_SURFACE;
  }
}

void OpenGLRenderer::ensureSurface() {
  if (_surface == EGL_NO_SURFACE) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Creating Window Surface...");
    _context->use();
    _surface = eglCreateWindowSurface(_context->display, _context->config, _outputSurface, nullptr);
  }
}

void OpenGLRenderer::renderTextureToSurface(const OpenGLTexture& texture, const float* transformMatrix) {
  ensureSurface();

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

void OpenGLRenderer::renderHardwareBufferToSurface(AHardwareBuffer* hardwareBuffer, const float* transformMatrix) {
#if __ANDROID_API__ >= 26
  ensureSurface();

  AHardwareBuffer_Desc description;
  AHardwareBuffer_describe(hardwareBuffer, &description);

  // 1. Create an OpenGL texture that describes the HardwareBuffer
  if (_hardwareBufferTexture == std::nullopt || _hardwareBufferTexture->width != description.width ||
      _hardwareBufferTexture->height != description.height) {
    // We need an input texture with the same size as the HardwareBuffer for OpenGL to be able to read the HardwareBuffer.
    _hardwareBufferTexture = _context->createTexture(OpenGLTexture::ExternalOES, description.width, description.height);
  }

  // 2. Activate the OpenGL context for this surface
  _context->use(_surface);

  // 3. Create an EGLImage from the HardwareBuffer
  EGLClientBuffer buffer = eglGetNativeClientBufferANDROID(hardwareBuffer);
  if (buffer == nullptr) {
    throw std::runtime_error("Failed to convert HardwareBuffer to EGLClientBuffer!");
  }
  constexpr EGLint eglImageAttributes[] = {EGL_NONE};
  EGLImageKHR eglImage = eglCreateImageKHR(_context->display, _context->context, EGL_NATIVE_BUFFER_ANDROID, buffer, eglImageAttributes);
  if (eglImage == EGL_NO_IMAGE_KHR) {
    throw std::runtime_error("Failed to create an EGLImage from the HardwareBuffer!");
  }

  // 4. Bind the HardwareBuffer to the OpenGL texture we created
  glEGLImageTargetTexture2DOES(GL_TEXTURE_2D, (GLeglImageOES)eglImage);

  // 5. Perform rendering as if it was a normal texture
  renderTextureToSurface(_hardwareBufferTexture.value(), transformMatrix);

  // 6. Cleanup
  eglDestroyImageKHR(_context->display, eglImage);
#else
    throw std::runtime_error("HardwareBuffer rendering is only supported is minSdk is set to API 26 or higher!");
#endif
}

} // namespace vision
