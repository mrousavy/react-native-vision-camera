//
// Created by Marc Rousavy on 09.08.23.
//

#pragma once

#include <GLES2/gl2.h>
#include <stdexcept>
#include <string>

namespace vision {

inline std::string getEglErrorIfAny() {
  EGLint error = glGetError();
  if (error != GL_NO_ERROR)
    return " Error: " + std::to_string(error);
  error = eglGetError();
  if (error != EGL_SUCCESS)
    return " Error: " + std::to_string(error);
  return "";
}

class OpenGLError : public std::runtime_error {
public:
  explicit OpenGLError(const std::string&& message) : std::runtime_error(message + getEglErrorIfAny()) {}

  static inline void checkIfError(const std::string&& message) {
    auto error = getEglErrorIfAny();
    if (error.length() > 0)
      throw std::runtime_error(message + error);
  }
};

} // namespace vision
