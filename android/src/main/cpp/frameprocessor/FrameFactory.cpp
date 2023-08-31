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

jni::local_ref<JFrame::javaobject> FrameFactory::createFrame() {
  std::unique_lock lock(_mutex);

  size_t bufferSize = _frameHeight * _bytesPerRow;

  // 0. If we didn't reach max frames yet, push a new frame to the BACK of the queue so it gets recycled first
  if (_frames.size() < _maxFrames) {
    _frames.push_back(FrameWithBuffer {
      .frame = nullptr,
      .buffer = (uint8_t*) malloc(sizeof(size_t) * bufferSize)
    });
  }

  // 1. Get last Frame
  FrameWithBuffer lastFrame = _frames.back();
  // 2. Close the old frame that was in there, marking it invalid for further use
  lastFrame.frame->cthis()->close();
  // 3. Remove it from the Queue
  _frames.pop_back();

  // 4. Create a new JFrame that points to the same memory buffer
  auto buffer = lastFrame.buffer;
  lastFrame.frame = JFrame::create(_frameWidth,
                                   _frameHeight,
                                   _bytesPerRow,
                                   0,
                                   "portrait",
                                   false,
                                   buffer,
                                   bufferSize);

  // 5. Push the new Frame to the front of the queue so it gets deleted last
  _frames.push_front(lastFrame);
}


} // namespace vision