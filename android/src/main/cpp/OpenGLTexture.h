//
// Created by Marc Rousavy on 30.08.23.
//

#pragma once

#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <stdexcept>

struct OpenGLTexture {
  enum Type { Texture2D, ExternalOES };

  // The ID of the texture as returned in glGenTextures(..)
  GLuint id;
  // GL_TEXTURE_2D or GL_TEXTURE_EXTERNAL_OES
  GLenum target;

  // Width and height of the texture (always 0 until you modify it)
  int width = 0;
  int height = 0;
};
