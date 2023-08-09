//
// Created by Marc Rousavy on 09.08.23.
//

#pragma once

#include <stdexcept>
#include <GLES2/gl2.h>

namespace vision {

inline std::string getEglErrorIfAny() {
  EGLint error = glGetError();
  if (error == GL_NO_ERROR) return "";
  return " Error: " + std::to_string(error);
}

class OpenGLError: public std::runtime_error {
 public:
  OpenGLError(const std::string&& message): std::runtime_error(message + getEglErrorIfAny()) {}
};

} // namespace vision
