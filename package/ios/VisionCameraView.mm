#ifdef RCT_NEW_ARCH_ENABLED
#import "VisionCameraView.h"

#import <react/renderer/components/RNVisionCameraViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNVisionCameraViewSpec/EventEmitters.h>
#import <react/renderer/components/RNVisionCameraViewSpec/Props.h>
#import <react/renderer/components/RNVisionCameraViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import "Utils.h"

using namespace facebook::react;

@interface VisionCameraView () <RCTVisionCameraViewViewProtocol>

@end

@implementation VisionCameraView {
    UIView * _view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<VisionCameraViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const VisionCameraViewProps>();
    _props = defaultProps;

    _view = [[UIView alloc] init];

    self.contentView = _view;
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<VisionCameraViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<VisionCameraViewProps const>(props);

    if (oldViewProps.color != newViewProps.color) {
        NSString * colorToConvert = [[NSString alloc] initWithUTF8String: newViewProps.color.c_str()];
        [_view setBackgroundColor: [Utils hexStringToColor:colorToConvert]];
    }

    [super updateProps:props oldProps:oldProps];
}

Class<RCTComponentViewProtocol> VisionCameraViewCls(void)
{
    return VisionCameraView.class;
}

@end
#endif
