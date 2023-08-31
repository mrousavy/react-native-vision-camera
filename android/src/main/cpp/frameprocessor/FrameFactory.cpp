//
// Created by Marc Rousavy on 31.08.23.
//

#include "FrameFactory.h"

namespace vision {

FrameFactory::FrameFactory(size_t frameWidth,
                           size_t frameHeight,
                           size_t bytesPerRow,
                           size_t maxFrames) {
  _frameWidth = frameWidth;
  _frameHeight = frameHeight;
  _bytesPerRow = bytesPerRow;
  _maxFrames = maxFrames;
}

FrameFactory::~FrameFactory() {
  std::unique_lock lock(_mutex);

  for (size_t i = 0; i < _frames.size(); i++) {
    auto frame = _frames.back();
    if (frame.frame != nullptr) frame.frame->cthis()->close();
    free(frame.buffer);
    _frames.pop_back();
  }
}

jni::local_ref<JFrame::javaobject> FrameFactory::createFrame() {
  auto bufferSize = _frameHeight * _bytesPerRow;
  auto buffer = (uint8_t*) malloc(bufferSize);
  return JFrame::create(_frameWidth,
                        _frameHeight,
                        _bytesPerRow,
                        0,
                        "portrait",
                        false,
                        buffer,
                        bufferSize);
}


} // namespace vision