#include "Logger.h"
#include "AndroidLogger.h"
#include <android/log.h>
#include <memory>

#define APP_NAME "NATIVE_VISION_CAMERA"

namespace reanimated
{

std::unique_ptr<LoggerInterface> Logger::instance = std::make_unique<AndroidLogger>();

void AndroidLogger::log(const char* str) {
    __android_log_print(ANDROID_LOG_VERBOSE, APP_NAME, "%s", str);
}

void AndroidLogger::log(double d) {
    __android_log_print(ANDROID_LOG_VERBOSE, APP_NAME, "%f", d);
}

void AndroidLogger::log(int i) {
    __android_log_print(ANDROID_LOG_VERBOSE, APP_NAME, "%d", i);
}

void AndroidLogger::log(bool b) {
    __android_log_print(ANDROID_LOG_VERBOSE, APP_NAME, "%s", b ? "true" : "false");
}

}