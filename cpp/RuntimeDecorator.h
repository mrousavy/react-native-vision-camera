#pragma once

#include <stdio.h>
#include <jsi/jsi.h>

using namespace facebook;

namespace reanimated {

class RuntimeDecorator {
public:
  static void decorateRuntime(jsi::Runtime &rt);
};

}
