//
// Created by Marc Rousavy on 10.08.23.
//

#include "SkiaRenderer.h"
#include <android/log.h>
#include "OpenGLError.h"

#include <gpu/gl/GrGLInterface.h>
#include <gpu/GrDirectContext.h>
#include <gpu/GrBackendSurface.h>
#include <gpu/ganesh/SkSurfaceGanesh.h>
#include <core/SkColorSpace.h>
#include <core/SkCanvas.h>

namespace vision {

SkiaRenderer::SkiaRenderer(ANativeWindow* previewSurface) {
  __android_log_print(ANDROID_LOG_INFO, TAG, "Initializing SkiaRenderer...");

  _previewSurface = previewSurface;
  _previewWidth = 0;
  _previewHeight = 0;

  __android_log_print(ANDROID_LOG_INFO, TAG, "...OpenGL");
  _gl = createOpenGLContext(previewSurface);
  ensureOpenGL();

  __android_log_print(ANDROID_LOG_INFO, TAG, "...Input Texture");
  GLuint textures[1];
  glGenTextures(1, textures);
  _inputTextureId = static_cast<int>(textures[0]);

  __android_log_print(ANDROID_LOG_INFO, TAG, "...Shaders");
  _shader = createPassThroughShader();

  __android_log_print(ANDROID_LOG_INFO, TAG, "...Skia");
  _skia = createSkiaContext();

  __android_log_print(ANDROID_LOG_INFO, TAG, "Successfully initialized SkiaRenderer!");
}

SkiaRenderer::~SkiaRenderer() {
  ANativeWindow_release(_previewSurface);

  if (_skia.context != nullptr) {
    // TODO: Do abandonContext()?
    __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying Skia Context...");
    _skia.context = nullptr;
  }
  if (_gl.display != EGL_NO_DISPLAY) {
    if (_gl.surface != EGL_NO_SURFACE) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Surface...");
      eglDestroySurface(_gl.display, _gl.surface);
      _gl.surface = EGL_NO_SURFACE;
    }
    if (_gl.context != EGL_NO_CONTEXT) {
      __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Context...");
      eglDestroyContext(_gl.display, _gl.context);
      _gl.context = EGL_NO_CONTEXT;
    }
    __android_log_print(ANDROID_LOG_INFO, TAG, "Destroying OpenGL Display...");
    eglTerminate(_gl.display);
    _gl.display = EGL_NO_DISPLAY;
  }
}

OpenGLContext SkiaRenderer::createOpenGLContext(ANativeWindow* previewSurface) {
  auto display = eglGetDisplay(EGL_DEFAULT_DISPLAY);
  if (display == EGL_NO_DISPLAY) throw OpenGLError("Failed to get default OpenGL Display!");

  EGLint major;
  EGLint minor;
  bool successful = eglInitialize(display, &major, &minor);
  if (!successful) throw OpenGLError("Failed to initialize OpenGL!");
  __android_log_print(ANDROID_LOG_INFO, TAG, "Using OpenGLES %i.%i", major, minor);

  EGLint attributes[] = {EGL_RENDERABLE_TYPE,
                         EGL_OPENGL_ES2_BIT,
                         EGL_SURFACE_TYPE,
                         EGL_WINDOW_BIT,
                         EGL_ALPHA_SIZE,
                         8,
                         EGL_BLUE_SIZE,
                         8,
                         EGL_GREEN_SIZE,
                         8,
                         EGL_RED_SIZE,
                         8,
                         EGL_DEPTH_SIZE,
                         0,
                         EGL_STENCIL_SIZE,
                         0,
                         EGL_NONE};
  EGLint numConfigs;
  EGLConfig config;
  successful = eglChooseConfig(display, attributes, &config, 1, &numConfigs);
  if (!successful || numConfigs == 0) throw OpenGLError("Failed to choose OpenGL config!");

  EGLint contextAttributes[] = {EGL_CONTEXT_CLIENT_VERSION, 2, EGL_NONE};
  auto context = eglCreateContext(display, config, nullptr, contextAttributes);
  if (context == EGL_NO_CONTEXT) throw OpenGLError("Failed to create OpenGL context!");

  auto surface = eglCreateWindowSurface(display, config, previewSurface, nullptr);
  if (surface == EGL_NO_SURFACE) throw OpenGLError("Failed to create OpenGL Surface!");

  return {
      .display = display,
      .context = context,
      .surface = surface,
      .config = config,
  };
}

void SkiaRenderer::ensureOpenGL() const {
  eglMakeCurrent(_gl.display, _gl.surface, _gl.surface, _gl.context);
}

void SkiaRenderer::onPreviewSurfaceSizeChanged(int width, int height) {
  _previewWidth = width;
  _previewHeight = height;
}

PassThroughShader SkiaRenderer::createPassThroughShader() {
  GLuint vertexBuffer;
  glGenBuffers(1, &vertexBuffer);
  glBindBuffer(GL_ARRAY_BUFFER, vertexBuffer);
  glBufferData(GL_ARRAY_BUFFER, 24 * sizeof(GLfloat), VertexData(), GL_STATIC_DRAW);

  GLuint program = CreateProgram(VertexShaderCode(), FragmentShaderCode());
  if (!program) throw OpenGLError("Failed to load pass-through Shader program!");

  glUseProgram(program);
  GLint aPosition = glGetAttribLocation(program, "aPosition");
  GLint aTexCoord = glGetAttribLocation(program, "aTexCoord");
  glPixelStorei(GL_UNPACK_ALIGNMENT, 1);
  if (glGetError() != GL_NO_ERROR) {
    glDeleteProgram(program);
    throw OpenGLError("Failed to load pass-through Shader program!");
  }

  return {
    .vertexBuffer = vertexBuffer,
    .program = program,
    .aPosition = aPosition,
    .aTexCoord = aTexCoord,
  };
}

SkiaContext SkiaRenderer::createSkiaContext() {
  auto interface = GrGLMakeNativeInterface();
  auto skiaContext = GrDirectContext::MakeGL(interface);
  if (skiaContext == nullptr) throw OpenGLError("Failed to create Skia Context from OpenGL context!");

  return {
    .context = skiaContext
  };
}

int SkiaRenderer::getInputTexture() const {
  return _inputTextureId;
}

void SkiaRenderer::onPreviewFrame() {
  ensureOpenGL();
  _skia.context->resetContext();

  SkColorType colorType;
  // setup surface for fbo0
  GrGLFramebufferInfo fboInfo;
  fboInfo.fFBOID = _inputTextureId;
  fboInfo.fFormat = 0x8058;
  colorType = kN32_SkColorType;

  __android_log_print(ANDROID_LOG_INFO, TAG, "Backend Render Target...");
  GrBackendRenderTarget backendRT(1280, 720, 0, 8, fboInfo);

  SkSurfaceProps props(0, kUnknown_SkPixelGeometry);

  __android_log_print(ANDROID_LOG_INFO, TAG, "Surface...");
  sk_sp<SkSurface> renderTarget(SkSurfaces::WrapBackendRenderTarget(
      _skia.context.get(), backendRT,
      kBottomLeft_GrSurfaceOrigin, colorType, nullptr, &props));

  __android_log_print(ANDROID_LOG_INFO, TAG, "Canvas");
  auto canvas = renderTarget->getCanvas();

  // TODO: Run Skia Frame Processor
  auto rect = SkRect::MakeXYWH(150, 250, 150, 50);
  auto paint = SkPaint();
  paint.setColor(SkColors::kRed);
  canvas->drawRect(rect, paint);

  // Flush
  __android_log_print(ANDROID_LOG_INFO, TAG, "Flush...");
  canvas->flush();
  __android_log_print(ANDROID_LOG_INFO, TAG, "eglSwap");

  bool successful = eglSwapBuffers(_gl.display, _gl.surface);
  if (!successful) throw OpenGLError("Failed to swap OpenGL buffers!");

  return;

  glBindTexture(GL_TEXTURE_2D, _inputTextureId);

  int viewportX = 0;
  int viewportY = 0;
  int viewportWidth = _previewWidth;
  int viewportHeight = _previewHeight;
  int textureWidth = 1280;
  int textureHeight = 720;

  int candidateWidth = (int) (((float) textureWidth / (float) textureHeight) * (float)_previewHeight);
  int candidateHeight = (int) (((float) textureHeight / (float) textureWidth) * (float)_previewWidth);

  if (candidateWidth > _previewWidth) {
    viewportX = -1 * (candidateWidth - _previewWidth) / 2;
    viewportWidth = candidateWidth;
  } else if (candidateHeight > _previewHeight) {
    viewportY = -1 * (candidateHeight - _previewHeight) / 2;
    viewportHeight = candidateHeight;
  }

  glViewport(viewportX, viewportY, viewportWidth, viewportHeight);

  glUseProgram(_shader.program);
  glVertexAttribPointer(_shader.aPosition, 4, GL_FLOAT, GL_FALSE, 6 * sizeof(GLfloat), (const GLvoid*) (0 * sizeof(GLfloat)));
  glEnableVertexAttribArray(_shader.aPosition);
  glVertexAttribPointer(_shader.aTexCoord, 2, GL_FLOAT, GL_FALSE, 6 * sizeof(GLfloat), (const GLvoid*) (4 * sizeof(GLfloat)));
  glEnableVertexAttribArray(_shader.aTexCoord);
  glBindBuffer(GL_ARRAY_BUFFER, _shader.vertexBuffer);
  glDrawElements(GL_TRIANGLE_STRIP, 4, GL_UNSIGNED_SHORT, VertexIndices());

  /*
  auto surface = createSkiaSurface(0, 1280, 720);
  auto canvas = surface->getCanvas();
  auto rect = SkRect::MakeXYWH(50, 150, 30, 50);
  auto paint = SkPaint();
  paint.setColor(SkColors::kRed);
  canvas->drawRect(rect, paint);
  canvas->flush();
  surface->flushAndSubmit();
   */

  glFlush();
  // eglSwapBuffers(_gl.display, _gl.surface);
}


void SkiaRenderer::onCameraFrame() {

}




const GLfloat* SkiaRenderer::VertexData() {
  static const GLfloat vertexData[] = {
      -1.0f, -1.0f, 0.0, 1.0, 0.0f, 0.0f,
      +1.0f, -1.0f, 0.0, 1.0, 1.0f, 0.0f,
      -1.0f, +1.0f, 0.0, 1.0, 0.0f, 1.0f,
      +1.0f, +1.0f, 0.0, 1.0, 1.0f, 1.0f,
  };

  return vertexData;
}

const GLushort* SkiaRenderer::VertexIndices() {
  static const GLushort vertexIndices[] = {
      0, 1, 2, 3
  };

  return vertexIndices;
}

const char* SkiaRenderer::VertexShaderCode() {
  static const char vertexShader[] =
      "attribute vec4 aPosition;\n"
      "attribute vec4 aTexCoord;\n"
      "varying vec2 vTexCoord;\n"
      "void main() {\n"
      "    gl_Position = aPosition;\n"
      "    vTexCoord = aTexCoord.xy;\n"
      "}\n";

  return vertexShader;
}

const char* SkiaRenderer::FragmentShaderCode() {
  static const char fragmentShader[] =
      "precision mediump float;\n"
      "uniform sampler2D uTexture;\n"
      "varying vec2 vTexCoord;\n"
      "void main() {\n"
      "    vec4 color = texture2D(uTexture, vTexCoord);\n"
      "    gl_FragColor = color;\n"
      "}\n";

  return fragmentShader;
}

GLuint SkiaRenderer::LoadShader(GLenum shaderType, const char* shaderCode) {
  GLuint shader = glCreateShader(shaderType);
  if (shader) {
    glShaderSource(shader, 1, &shaderCode, NULL);
    glCompileShader(shader);
    GLint isCompiled = GL_FALSE;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &isCompiled);
    if (!isCompiled) {
      glDeleteShader(shader);
      throw OpenGLError("Failed to load OpenGL shader!");
    }
  }
  return shader;
}

GLuint SkiaRenderer::CreateProgram(const char* vertexShaderCode, const char* fragmentShaderCode) {
  GLuint vertexShader = LoadShader(GL_VERTEX_SHADER, vertexShaderCode);
  if (!vertexShader) throw OpenGLError("Failed to load pass-through Vertex Shader!");

  GLuint fragmentShader = LoadShader(GL_FRAGMENT_SHADER, fragmentShaderCode);
  if (!fragmentShader) throw OpenGLError("Failed to load pass-through Fragment Shader!");

  GLuint program = glCreateProgram();
  if (program) {
    glAttachShader(program, vertexShader);
    if (glGetError() != GL_NO_ERROR) throw OpenGLError("Failed to attach pass-through Vertex Shader!");

    glAttachShader(program, fragmentShader);
    if (glGetError() != GL_NO_ERROR) throw OpenGLError("Failed to attach pass-through Fragment Shader!");

    glLinkProgram(program);
    GLint isLinked = GL_FALSE;
    glGetProgramiv(program, GL_LINK_STATUS, &isLinked);
    if (!isLinked) {
      glDeleteProgram(program);
      throw OpenGLError("Failed to link OpenGL program!");
    }
  }
  return program;
}


} // namespace vision