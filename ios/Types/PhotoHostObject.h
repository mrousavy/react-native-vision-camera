//
//  PhotoHostObject.h
//  VisionCamera
//
//  Created by Marc Rousavy on 04.01.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

#pragma once

#import <jsi/jsi.h>
#import <AVFoundation/AVCapturePhoto.h>

using namespace facebook;

class JSI_EXPORT PhotoHostObject: public jsi::HostObject {
public:
  explicit PhotoHostObject(AVCapturePhoto* photo): photo(photo) {}

public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;
  void close();

public:
  AVCapturePhoto* photo;
};
