//
// Created by Marc Rousavy on 25.08.23.
//

#include "VideoPipeline.h"
#include "OpenGLError.h"

#include <android/native_window_jni.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <EGL/egl.h>

namespace vision {

jni::local_ref<VideoPipeline::jhybriddata> VideoPipeline::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

VideoPipeline::VideoPipeline(jni::alias_ref<jhybridobject> jThis): _javaPart(jni::make_global(jThis)) { }

VideoPipeline::~VideoPipeline() {
  // 1. Remove output surfaces
  removeFrameProcessorOutputSurface();
  removeRecordingSessionOutputSurface();
  removePreviewOutputSurface();
  // 2. Delete the pass-through shader
  delete _passThroughShader;
  if (_vertexBuffer != NO_BUFFER) {
    glDeleteBuffers(1, &_vertexBuffer);
    _vertexBuffer = NO_BUFFER;
  }
  // 3. Delete the input textures
  if (_inputTextureId != NO_TEXTURE) {
    glDeleteTextures(1, &_inputTextureId);
    _inputTextureId = NO_TEXTURE;
  }
  if (_offscreenFrameBuffer != NO_FRAME_BUFFER) {
    glDeleteFramebuffers(1, &_offscreenFrameBuffer);
    _offscreenFrameBuffer = NO_FRAME_BUFFER;
  }
  // 4. Destroy the OpenGL context
  if (_context != nullptr) {
    _context->destroy();
  }
}

void VideoPipeline::setSize(int width, int height) {
  _width = width;
  _height = height;
}

void VideoPipeline::removeFrameProcessorOutputSurface() {
  if (_frameProcessorOutput.surface != nullptr) {
    ANativeWindow_release(_frameProcessorOutput.surface);
    _frameProcessorOutput = {
        .surface = nullptr,
        .width = 0,
        .height = 0
    };
  }
}

void VideoPipeline::setFrameProcessorOutputSurface(jobject surface) {
  // 1. Delete existing output surface
  removeFrameProcessorOutputSurface();

  // 2. Set new output surface if it is not null
  _frameProcessorOutput = {
      .surface = ANativeWindow_fromSurface(jni::Environment::current(), surface),
      .width = _width,
      .height = _height
  };
}

void VideoPipeline::removeRecordingSessionOutputSurface() {
  if (_recordingSessionOutput.surface != nullptr) {
    ANativeWindow_release(_recordingSessionOutput.surface);
    _recordingSessionOutput = {
        .surface = nullptr,
        .width = 0,
        .height = 0
    };
  }
}

void VideoPipeline::setRecordingSessionOutputSurface(jobject surface, jint width, jint height) {
  // 1. Delete existing output surface
  removePreviewOutputSurface();

  // 2. Set new output surface if it is not null
  _previewOutput = {
      .surface = ANativeWindow_fromSurface(jni::Environment::current(), surface),
      .width = width,
      .height = height
  };
}

void VideoPipeline::removePreviewOutputSurface() {
  if (_previewOutput.surface != nullptr) {
    ANativeWindow_release(_previewOutput.surface);
    _previewOutput = {
        .surface = nullptr,
        .width = 0,
        .height = 0
    };
    delete _context;
  }
}

void VideoPipeline::setPreviewOutputSurface(jobject surface, jint width, jint height) {
  // 1. Delete existing output surface
  removeRecordingSessionOutputSurface();

  // 2. Set new output surface if it is not null
  _previewOutput = {
      .surface = ANativeWindow_fromSurface(jni::Environment::current(), surface),
      .width = width,
      .height = height
  };

  delete _context;
  _context = new OpenGLContext(_previewOutput.surface);
}

int VideoPipeline::getInputTextureId() {
  if (_context == nullptr) throw std::runtime_error("Failed to get input texture ID: The context is not yet ready.");
  _context->use();

  if (_inputTextureId != NO_TEXTURE) return static_cast<int>(_inputTextureId);

  GLuint textureId;
  glGenTextures(1, &textureId);
  _inputTextureId = textureId;

  return static_cast<int>(_inputTextureId);
}

void VideoPipeline::onBeforeFrame() {
  // TODO: Prepare for updateTexImage() call
}

void VideoPipeline::onFrame(jni::alias_ref<jni::JArrayFloat> transformMatrixParam, jni::alias_ref<jni::JArrayFloat> rotationMatrixParam) {
  if (_context == nullptr) throw std::runtime_error("Failed to render a Frame: The context is not yet ready.");
  _context->use();


  glClearColor(1.0f, 0.0f, 0.0f, 1.0f);
  glClear(GL_COLOR_BUFFER_BIT);

  eglSwapBuffers(_context->display, _context->surface);

  return;

  if (_offscreenFrameBuffer == NO_FRAME_BUFFER) {
    glGenFramebuffers(1, &_offscreenFrameBuffer);
  }

  glBindFramebuffer(GL_FRAMEBUFFER, _offscreenFrameBuffer);
  if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
    throw std::runtime_error("Cannot render to offscreen Frame Buffer, it is not properly configured!");
  }


  return;

  if (_passThroughShader == nullptr) {
    _passThroughShader = new PassThroughShader();
  }
  if (_vertexBuffer == NO_BUFFER) {
    glGenBuffers(1, &_vertexBuffer);
  }

  glBindBuffer(GL_ARRAY_BUFFER, _vertexBuffer);
  glBufferData(GL_ARRAY_BUFFER, 24 * sizeof(GLfloat), _passThroughShader->getVertexData(), GL_STATIC_DRAW);

  glViewport(0, 0, _width, _height);

  glDisable(GL_BLEND);
  glBindTexture(GL_TEXTURE_EXTERNAL_OES, _inputTextureId);


  glUseProgram(_passThroughShader->getProgramId());

  float transformMatrix[MATRIX_SIZE];
  transformMatrixParam->getRegion(0, MATRIX_SIZE - 1, transformMatrix);
  glUniformMatrix4fv(_passThroughShader->uTransformMatrix(), 1, GL_FALSE, transformMatrix);
  float rotationMatrix[MATRIX_SIZE];
  rotationMatrixParam->getRegion(0, MATRIX_SIZE - 1, rotationMatrix);
  glUniformMatrix4fv(_passThroughShader->uRotationMatrix(), 1, GL_FALSE, rotationMatrix);

  glVertexAttribPointer(_passThroughShader->aPosition(), 4, GL_FLOAT, GL_FALSE, 6 * sizeof(GLfloat), (const GLvoid*) (0 * sizeof(GLfloat)));
  glEnableVertexAttribArray(_passThroughShader->aPosition());
  glVertexAttribPointer(_passThroughShader->aTexCoord(), 2, GL_FLOAT, GL_FALSE, 6 * sizeof(GLfloat), (const GLvoid*) (4 * sizeof(GLfloat)));
  glEnableVertexAttribArray(_passThroughShader->aTexCoord());
  glBindBuffer(GL_ARRAY_BUFFER, _vertexBuffer);
  glDrawElements(GL_TRIANGLE_STRIP, 4, GL_UNSIGNED_SHORT, _passThroughShader->getVertexIndices());
}

void VideoPipeline::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", VideoPipeline::initHybrid),
    makeNativeMethod("setFrameProcessorOutputSurface", VideoPipeline::setFrameProcessorOutputSurface),
    makeNativeMethod("removeFrameProcessorOutputSurface", VideoPipeline::removeFrameProcessorOutputSurface),
    makeNativeMethod("setRecordingSessionOutputSurface", VideoPipeline::setRecordingSessionOutputSurface),
    makeNativeMethod("removeRecordingSessionOutputSurface", VideoPipeline::removeRecordingSessionOutputSurface),
    makeNativeMethod("setPreviewOutputSurface", VideoPipeline::setPreviewOutputSurface),
    makeNativeMethod("removePreviewOutputSurface", VideoPipeline::removePreviewOutputSurface),
    makeNativeMethod("getInputTextureId", VideoPipeline::getInputTextureId),
    makeNativeMethod("onBeforeFrame", VideoPipeline::onBeforeFrame),
    makeNativeMethod("onFrame", VideoPipeline::onFrame),
  });
}

} // vision