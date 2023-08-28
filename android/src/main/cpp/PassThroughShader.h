//
// Created by Marc Rousavy on 28.08.23.
//

#pragma once

#include <EGL/egl.h>
#include <GLES2/gl2.h>

namespace vision {

class PassThroughShader {

 public:
  explicit PassThroughShader();
  ~PassThroughShader();

  // Program ID for useProgram
  GLuint getProgramId() const;
  // Positions for arguments in Program
  GLint aPosition() const;
  GLint aTexCoord() const;
  GLint uTransformMatrix() const;
  GLint uRotationMatrix() const;

  const GLfloat* getVertexData() const;
  const GLushort* getVertexIndices() const;

 private:
  GLuint _programId;
  GLint _aPosition, _aTexCoord, _uTransformMatrix, _uRotationMatrix;
  GLuint loadShader(GLenum shaderType, const char* shaderCode);
  GLuint createProgram();

 private:
  static constexpr GLfloat VERTEX_DATA[] = {
      -1.0f, -1.0f, 0.0, 1.0, 0.0f, 0.0f,
      +1.0f, -1.0f, 0.0, 1.0, 1.0f, 0.0f,
      -1.0f, +1.0f, 0.0, 1.0, 0.0f, 1.0f,
      +1.0f, +1.0f, 0.0, 1.0, 1.0f, 1.0f,
  };
  static constexpr GLushort VERTEX_INDICES[] = {
      0, 1, 2, 3
  };

  static constexpr char VERTEX_SHADER[] =
      "uniform mat4 uTransformMatrix;\n"
      "uniform mat4 uRotationMatrix;\n"
      "attribute vec4 aPosition;\n"
      "attribute vec4 aTexCoord;\n"
      "varying vec2 vTexCoord;\n"
      "void main() {\n"
      "    gl_Position = uRotationMatrix * aPosition;\n"
      "    vTexCoord = (uTransformMatrix * aTexCoord).xy;\n"
      "}\n";
  static constexpr char FRAGMENT_SHADER[] =
      "#extension GL_OES_EGL_image_external:require\n"
      "precision mediump float;\n"
      "uniform samplerExternalOES uTexture;\n"
      "varying vec2 vTexCoord;\n"
      "void main() {\n"
      "    gl_FragColor = texture2D(uTexture, vTexCoord);\n"
      "}\n";

};

} // vision

