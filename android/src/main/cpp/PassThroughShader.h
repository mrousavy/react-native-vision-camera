//
// Created by Marc Rousavy on 28.08.23.
//

#pragma once

#include <EGL/egl.h>
#include <GLES2/gl2.h>

namespace vision {

#define NO_SHADER 0
#define NO_POSITION 0

class PassThroughShader {

 public:
  explicit PassThroughShader();
  ~PassThroughShader();

  /**
   * Draw the texture using this shader.
   */
  void draw(GLuint textureId, float* transformMatrix);

  private:
  // Loading
  static GLuint loadShader(GLenum shaderType, const char* shaderCode);
  static GLuint createProgram();

 private:
  // Parameters
  GLuint _programId = NO_SHADER;
  struct VertexParameters {
    GLint inPosition = NO_POSITION;
    GLint inTexCoord = NO_POSITION;
    GLint transformMatrix = NO_POSITION;
  } _vertexParameters;
  struct FragmentParameters {
    GLint textureSampler = NO_POSITION;
  } _fragmentParameters;

 private:
  // Statics
  static constexpr GLfloat VERTEX_INDICES[] = {
      -1.0f, -1.0f,
      1.0f, -1.0f,
      -1.0f,  1.0f,
      1.0f,  1.0f,
  };
  static constexpr GLfloat TEXTURE_COORDINATES[] = {
      0.0f, 0.0f,
      1.0f, 0.0f,
      0.0f, 1.0f,
      1.0f, 1.0f,
  };

  static constexpr char VERTEX_SHADER[] = R"(
    attribute vec2 inPosition;
    attribute vec2 inTexCoord;
    uniform mat4 transformMatrix;

    varying vec2 fragTexCoord;

    void main() {
      gl_Position = transformMatrix * vec4(inPosition, 0.0, 1.0);
      fragTexCoord = inTexCoord;
    }
  )";
  static constexpr char FRAGMENT_SHADER[] = R"(
    #extension GL_OES_EGL_image_external : require
    precision mediump float;
    varying vec2 fragTexCoord;
    uniform samplerExternalOES textureSampler;

    void main() {
        gl_FragColor = texture2D(textureSampler, fragTexCoord);
    }
  )";
};

} // vision

