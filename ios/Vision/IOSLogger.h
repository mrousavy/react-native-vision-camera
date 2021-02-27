#pragma once

#include "../../cpp/LoggerInterface.h"
#include <stdio.h>

namespace vision {

class IOSLogger : public LoggerInterface {
  public:
    void log(const char* str) override;
    void log(double d) override;
    void log(int i) override;
    void log(bool b) override;
    virtual ~IOSLogger() {}
};

}
