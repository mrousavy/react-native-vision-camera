//
//  JSINSObjectConversion.h
//  VisionCamera
//
//  Created by Marc Rousavy on 30.04.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import "SharedArray.h"
#import <ReactCommon/CallInvoker.h>
#import <jsi/jsi.h>

namespace JSINSObjectConversion {

using namespace facebook;
using namespace facebook::react;

// id -> any
jsi::Value convertObjCObjectToJSIValue(jsi::Runtime& runtime, id value);

// any -> id
id convertJSIValueToObjCObject(jsi::Runtime& runtime, const jsi::Value& value);

// object -> NSDictionary*
NSDictionary* convertJSIObjectToObjCDictionary(jsi::Runtime& runtime, const jsi::Object& object);

} // namespace JSINSObjectConversion
