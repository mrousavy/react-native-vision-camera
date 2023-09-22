//
// Created by Marc Rousavy on 28.08.23.
//

#include "PassThroughShader.h"
#include "OpenGLError.h"
#include <EGL/egl.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <memory>
#include <string>

namespace vision {

PassThroughShader::~PassThroughShader() {
  if (_programId != NO_SHADER) {
    glDeleteProgram(_programId);
    _programId = NO_SHADER;
  }

  if (_vertexBuffer != NO_BUFFER) {
    glDeleteBuffers(1, &_vertexBuffer);
    _vertexBuffer = NO_BUFFER;
  }
}

void PassThroughShader::draw(const OpenGLTexture& texture, float* transformMatrix) {
  // 1. Set up Shader Program
  if (_programId == NO_SHADER) {
    _programId = createProgram();
    glUseProgram(_programId);
    _vertexParameters = {
        .aPosition = glGetAttribLocation(_programId, "aPosition"),
        .aTexCoord = glGetAttribLocation(_programId, "aTexCoord"),
        .uTransformMatrix = glGetUniformLocation(_programId, "uTransformMatrix"),
    };
    _fragmentParameters = {
        .uTexture = glGetUniformLocation(_programId, "uTexture"),
    };
  }

  glUseProgram(_programId);

  // 2. Set up Vertices Buffer
  if (_vertexBuffer == NO_BUFFER) {
    glGenBuffers(1, &_vertexBuffer);
    glBindBuffer(GL_ARRAY_BUFFER, _vertexBuffer);
    glBufferData(GL_ARRAY_BUFFER, sizeof(VERTICES), VERTICES, GL_STATIC_DRAW);
  }

  // 3. Pass all uniforms/attributes for vertex shader
  glEnableVertexAttribArray(_vertexParameters.aPosition);
  glVertexAttribPointer(_vertexParameters.aPosition, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex),
                        reinterpret_cast<void*>(offsetof(Vertex, position)));

  glEnableVertexAttribArray(_vertexParameters.aTexCoord);
  glVertexAttribPointer(_vertexParameters.aTexCoord, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex),
                        reinterpret_cast<void*>(offsetof(Vertex, texCoord)));

  glUniformMatrix4fv(_vertexParameters.uTransformMatrix, 1, GL_FALSE, transformMatrix);

  // 4. Pass texture to fragment shader
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(texture.target, texture.id);
  glUniform1i(_fragmentParameters.uTexture, 0);

  // 5. Draw!
  glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
}

GLuint PassThroughShader::loadShader(GLenum shaderType, const char* shaderCode) {
  GLuint shader = glCreateShader(shaderType);
  if (shader == 0)
    throw OpenGLError("Failed to load shader!");

  glShaderSource(shader, 1, &shaderCode, nullptr);
  glCompileShader(shader);
  GLint compileStatus = GL_FALSE;
  glGetShaderiv(shader, GL_COMPILE_STATUS, &compileStatus);
  if (compileStatus == GL_FALSE) {
    glDeleteShader(shader);
    throw OpenGLError("Failed to compile shader!");
  }
  return shader;
}

GLuint PassThroughShader::createProgram() {
  GLuint vertexShader = loadShader(GL_VERTEX_SHADER, VERTEX_SHADER);
  GLuint fragmentShader = loadShader(GL_FRAGMENT_SHADER, FRAGMENT_SHADER);

  GLuint program = glCreateProgram();
  if (program == 0)
    throw OpenGLError("Failed to create pass-through program!");

  glAttachShader(program, vertexShader);
  OpenGLError::checkIfError("Failed to attach Vertex Shader!");

  glAttachShader(program, fragmentShader);
  OpenGLError::checkIfError("Failed to attach Fragment Shader!");

  glLinkProgram(program);
  GLint linkStatus = GL_FALSE;
  glGetProgramiv(program, GL_LINK_STATUS, &linkStatus);
  if (!linkStatus) {
    glDeleteProgram(program);
    throw OpenGLError("Failed to load pass-through program!");
  }
  return program;
}

} // namespace vision
