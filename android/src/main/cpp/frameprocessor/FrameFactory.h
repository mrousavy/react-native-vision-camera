//
// Created by Marc Rousavy on 31.08.23.
//

#pragma once

#include <fbjni/fbjni.h>
#include "JFrame.h"
#include <queue>
#include <mutex>

namespace vision {

struct FrameWithBuffer {
  jni::local_ref<JFrame::javaobject> frame;
  uint8_t* buffer;
};

class FrameFactory {
 public:
  FrameFactory(size_t frameWidth,
               size_t frameHeight,
               size_t bytesPerRow,
               size_t maxFrames = 3);

  jni::local_ref<JFrame::javaobject> createFrame();

 private:
  size_t _frameWidth;
  size_t _frameHeight;
  size_t _bytesPerRow;
  size_t _maxFrames = 0;
  std::deque<FrameWithBuffer> _frames;
  std::mutex _mutex;
};

} // namespace vision
