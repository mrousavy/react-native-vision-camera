//
// Created by Marc Rousavy on 28.08.23.
//

#include "PassThroughShader.h"
#include <EGL/egl.h>
#include <memory>
#include "OpenGLError.h"
#include <string>

namespace vision {


PassThroughShader::PassThroughShader() {
  _programId = createProgram();

  glUseProgram(_programId);

  _aPosition = glGetAttribLocation(_programId, "aPosition");
  _aTexCoord = glGetAttribLocation(_programId, "aTexCoord");
  _uTransformMatrix = glGetUniformLocation(_programId, "uTransformMatrix");
  _uRotationMatrix = glGetUniformLocation(_programId, "uRotationMatrix");
}

PassThroughShader::~PassThroughShader() {
  glDeleteProgram(_programId);
}

GLuint PassThroughShader::getProgramId() const {
  return _programId;
}

GLint PassThroughShader::aPosition() const {
  return _aPosition;
}

GLint PassThroughShader::aTexCoord() const {
  return _aTexCoord;
}

GLint PassThroughShader::uTransformMatrix() const {
  return _uTransformMatrix;
}

GLint PassThroughShader::uRotationMatrix() const {
  return _uRotationMatrix;
}

const GLfloat* PassThroughShader::getVertexData() const {
  return VERTEX_DATA;
}

const GLushort* PassThroughShader::getVertexIndices() const {
  return VERTEX_INDICES;
}

GLuint PassThroughShader::loadShader(GLenum shaderType, const char* shaderCode) {
  GLuint shader = glCreateShader(shaderType);
  if (shader == 0) throw OpenGLError("Failed to load shader!");

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
  if (program == 0) throw OpenGLError("Failed to create pass-through program!");

  glAttachShader(program, vertexShader);
  if (glGetError() != GL_NO_ERROR) throw OpenGLError("Failed to attach Vertex Shader!");

  glAttachShader(program, fragmentShader);
  if (glGetError() != GL_NO_ERROR) throw OpenGLError("Failed to attach Fragment Shader!");

  glLinkProgram(program);
  GLint linkStatus = GL_FALSE;
  glGetProgramiv(program, GL_LINK_STATUS, &linkStatus);
  if (!linkStatus) {
    glDeleteProgram(program);
    throw OpenGLError("Failed to load pass-through program!");
  }
  return program;
}



} // vision