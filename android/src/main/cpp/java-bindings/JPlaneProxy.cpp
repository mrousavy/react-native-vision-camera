//
// Created by Marc Rousavy on 20.08.21.
//

#include "JPlaneProxy.h"

namespace vision {

int JPlaneProxy::getRowStride() {
  static const auto getRowStrideMethod = getClass()->getMethod<int()>("getRowStride");
  return getRowStrideMethod(self());
}

} // namespace vision