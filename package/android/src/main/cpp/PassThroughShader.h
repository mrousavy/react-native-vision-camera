//
// Created by Marc Rousavy on 28.08.23.
//

#pragma once

#include <EGL/egl.h>
#include <GLES2/gl2.h>

#include "OpenGLTexture.h"

namespace vision {

#define NO_SHADER 0
#define NO_POSITION 0
#define NO_BUFFER 0

struct Vertex {
  GLfloat position[2];
  GLfloat texCoord[2];
};

class PassThroughShader {
public:
  PassThroughShader() = default;
  ~PassThroughShader();

  /**
   * Draw the texture using this shader.
   * Note: At the moment, only EXTERNAL textures are supported by the Shader.
   */
  void draw(const OpenGLTexture& texture, float* transformMatrix);

private:
  // Loading
  static GLuint loadShader(GLenum shaderType, const char* shaderCode);
  static GLuint createProgram();

private:
  // Parameters
  GLuint _programId = NO_SHADER;
  GLuint _vertexBuffer = NO_BUFFER;
  struct VertexParameters {
    GLint aPosition = NO_POSITION;
    GLint aTexCoord = NO_POSITION;
    GLint uTransformMatrix = NO_POSITION;
  } _vertexParameters;
  struct FragmentParameters {
    GLint uTexture = NO_POSITION;
  } _fragmentParameters;

private:
  // Statics
  static constexpr Vertex VERTICES[] = {
      {{-1.0f, -1.0f}, {0.0f, 0.0f}}, // bottom-left
      {{1.0f, -1.0f}, {1.0f, 0.0f}},  // bottom-right
      {{-1.0f, 1.0f}, {0.0f, 1.0f}},  // top-left
      {{1.0f, 1.0f}, {1.0f, 1.0f}}    // top-right
  };

  static constexpr char VERTEX_SHADER[] = R"(
    attribute vec4 aPosition;
    attribute vec2 aTexCoord;
    uniform mat4 uTransformMatrix;
    varying vec2 vTexCoord;

    void main() {
        gl_Position = aPosition;
        vTexCoord = (uTransformMatrix * vec4(aTexCoord, 0.0, 1.0)).xy;
    }
  )";
  static constexpr char FRAGMENT_SHADER[] = R"(
    #extension GL_OES_EGL_image_external : require
    precision mediump float;
    varying vec2 vTexCoord;
    uniform samplerExternalOES uTexture;

    void main() {
        gl_FragColor = texture2D(uTexture, vTexCoord);
    }
  )";
};

} // namespace vision
