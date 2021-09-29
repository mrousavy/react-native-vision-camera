//
// Created by Marc Rousavy on 29.09.21.
//

#include "JFrameProcessorPlugin.h"

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using namespace jni;

/*
int JImageProxy::getWidth() {
  static const auto getWidthMethod = getClass()->getMethod<jint()>("getWidth");
  return getWidthMethod(self());
}

int JImageProxy::getHeight() {
  static const auto getWidthMethod = getClass()->getMethod<jint()>("getHeight");
  return getWidthMethod(self());
}

alias_ref<JClass> getUtilsClass() {
  static const auto ImageProxyUtilsClass = findClassStatic("com/mrousavy/camera/frameprocessor/ImageProxyUtils");
  return ImageProxyUtilsClass;
}

bool JImageProxy::getIsValid() {
  auto utilsClass = getUtilsClass();
  static const auto isImageProxyValidMethod = utilsClass->getStaticMethod<jboolean(JImageProxy::javaobject)>("isImageProxyValid");
  return isImageProxyValidMethod(utilsClass, self());
}

int JImageProxy::getPlanesCount() {
  auto utilsClass = getUtilsClass();
  static const auto getPlanesCountMethod = utilsClass->getStaticMethod<jint(JImageProxy::javaobject)>("getPlanesCount");
  return getPlanesCountMethod(utilsClass, self());
}

int JImageProxy::getBytesPerRow() {
  auto utilsClass = getUtilsClass();
  static const auto getBytesPerRowMethod = utilsClass->getStaticMethod<jint(JImageProxy::javaobject)>("getBytesPerRow");
  return getBytesPerRowMethod(utilsClass, self());
}

void JImageProxy::close() {
  static const auto getNameMethod = getClass()->getMethod<void()>("close");
  closeMethod(self());
}
*/

using TCallback = jobject(alias_ref<JImageProxy::javaobject>, alias_ref<JArrayClass<jobject>>);

local_ref<jobject> JFrameProcessorPlugin::callback(alias_ref<JImageProxy::javaobject> image, alias_ref<JArrayClass<jobject>> params) {
  auto func = javaPart_->getClass()->getMethod<TCallback>("callback");

  auto result = func(javaPart_.get(), image, params);
  return make_local(result);
}

std::string JFrameProcessorPlugin::getName() {
  return name;
}

} // namespace vision
