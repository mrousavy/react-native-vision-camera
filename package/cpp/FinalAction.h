//
//  MutableRawBuffer.h
//  VisionCamera
//
//  Created by Marc Rousavy on 17.01.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

#pragma once

namespace vision {

template <typename F> struct FinalAction {

public:
  FinalAction(F f) : clean_{f} {}
  ~FinalAction() {
    if (enabled_)
      clean_();
  }
  void disable() {
    enabled_ = false;
  };

private:
  F clean_;
  bool enabled_ = true;
};

} // namespace vision

template <typename F> vision::FinalAction<F> finally(F f) {
  return vision::FinalAction<F>(std::move(f));
}