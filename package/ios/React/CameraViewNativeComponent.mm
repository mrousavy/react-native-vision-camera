//
//  CameraViewNativeComponent.m
//  VisionCamera
//
//  Created by Hanno Gödecke on 18.10.24.
//

#import "CameraViewNativeComponent.h"

#import <react/renderer/components/RNVisionCameraSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNVisionCameraSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface CameraViewNativeComponent() <RCTCameraViewViewProtocol>
@end

@implementation CameraViewNativeComponent

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<CameraViewComponentDescriptor>();
}

@end

Class<RCTComponentViewProtocol> CameraViewCls(void)
{
    return CameraViewNativeComponent.class;
}
