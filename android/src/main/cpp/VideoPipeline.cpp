//
// Created by Marc Rousavy on 25.08.23.
//

#include "VideoPipeline.h"

namespace vision {

// TODO: Implement pipeline

jni::local_ref<VideoPipeline::jhybriddata> VideoPipeline::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

VideoPipeline::VideoPipeline(jni::alias_ref<jhybridobject> jThis): _javaPart(jni::make_global(jThis)) { }

void VideoPipeline::registerNatives() {
  registerHybrid({
     makeNativeMethod("initHybrid", VideoPipeline::initHybrid),
  });
}

} // vision