//
// Created by Marc Rousavy on 09.08.23.
//

#pragma once

#if VISION_CAMERA_ENABLE_SKIA

#include <string>
#include <stdexcept>
#include <GLES2/gl2.h>

namespace vision {

inline std::string getEglErrorIfAny() {
  EGLint error = glGetError();
  if (error != GL_NO_ERROR) return " Error: " + std::to_string(error);
  error = eglGetError();
  if (error != EGL_SUCCESS) return " Error: " + std::to_string(error);
  return "";
}

class OpenGLError: public std::runtime_error {
 public:
  explicit OpenGLError(const std::string&& message): std::runtime_error(message + getEglErrorIfAny()) {}
};

} // namespace vision

#endif
