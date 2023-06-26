//
//  TensorflowPlugin.h
//  VisionCamera
//
//  Created by Marc Rousavy on 26.06.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#import <jsi/jsi.h>

@interface TensorflowPlugin : NSObject

+ (void) installToRuntime:(facebook::jsi::Runtime&)runtime;

@end


