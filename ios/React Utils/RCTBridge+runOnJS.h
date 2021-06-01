//
//  RCTBridge+runOnJS.h
//  VisionCamera
//
//  Created by Marc Rousavy on 23.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

#pragma once

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

@interface RCTBridge (RunOnJS)

- (void) runOnJS:(void (^)(void))block NS_SWIFT_NAME( runOnJS(_:) );

@end
