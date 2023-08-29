//
// Created by Marc Rousavy on 28.08.23.
//

#include "PassThroughShader.h"
#include <EGL/egl.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <memory>
#include "OpenGLError.h"
#include <string>

namespace vision {


PassThroughShader::PassThroughShader() = default;

PassThroughShader::~PassThroughShader() {
  glDeleteProgram(_programId);
  _programId = NO_SHADER;
}

void PassThroughShader::draw(GLuint textureId, float* transformMatrix) {
  if (_programId == NO_SHADER) {
    _programId = createProgram();
  }

  glUseProgram(_programId);

  if (_vertexParameters.inPosition == NO_POSITION) {
    _vertexParameters = {
        .inPosition = glGetAttribLocation(_programId, "inPosition"),
        .inTexCoord = glGetAttribLocation(_programId, "inTexCoord"),
        .transformMatrix = glGetUniformLocation(_programId, "transformMatrix"),
    };
    _fragmentParameters = {
        .textureSampler = glGetUniformLocation(_programId, "textureSampler"),
    };
  }

  // Pass indices/coordinates
  glVertexAttribPointer(_vertexParameters.inPosition, 2, GL_FLOAT, GL_FALSE, 0, VERTICES);
  glVertexAttribPointer(_vertexParameters.inTexCoord, 2, GL_FLOAT, GL_FALSE, 0, TEXTURE_COORDINATES);

  glEnableVertexAttribArray(_vertexParameters.inPosition);
  glEnableVertexAttribArray(_vertexParameters.inTexCoord);

  // Apply matrix transformation from Camera
  glUniformMatrix4fv(_vertexParameters.transformMatrix, 1, GL_FALSE, transformMatrix);

  // Use GL_TEXTURE_EXTERNAL_OES for the shader
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(GL_TEXTURE_EXTERNAL_OES, textureId);
  glUniform1i(_fragmentParameters.textureSampler, 0);

  glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
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