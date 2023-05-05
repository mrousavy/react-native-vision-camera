//
// Created by Marc Rousavy on 05.05.23.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

namespace vision {

using namespace facebook;
using namespace jni;

struct JFrame : public JavaClass<JFrame> {
    static constexpr auto kJavaDescriptor = "Lcom/mrousavy/frameprocessor/Frame;";

public:
    int getWidth() const;
    int getHeight() const;
    bool getIsValid() const;
    bool getIsMirrored() const;
    int getPlanesCount() const;
    int getBytesPerRow() const;
    jlong getTimestamp() const;
    local_ref<JString> getOrientation() const;
    local_ref<JArrayByte> toByteArray() const;
    void close();
};

} // namespace vision