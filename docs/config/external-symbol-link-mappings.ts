export type ExternalSymbolLinkMappings = Record<string, Record<string, string>>

export const externalSymbolLinkMappings = {
  typescript: {
    ArrayBuffer:
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer',
    Error:
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
    Object:
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object',
    Promise:
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
  },
  'react-native-reanimated': {
    SharedValue:
      'https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue',
  },
  'react-native-nitro-image': {
    Image: 'https://github.com/mrousavy/react-native-nitro-image',
  },
  'react-native-nitro-modules': {
    HybridObject: 'https://nitro.margelo.com/docs/hybrid-objects',
    'HybridObject.dispose': 'https://nitro.margelo.com/docs/hybrid-objects',
  },
  '@shopify/react-native-skia': {
    SkCanvas:
      'https://shopify.github.io/react-native-skia/docs/canvas/overview/',
    SkImage: 'https://shopify.github.io/react-native-skia/docs/images/',
  },
} satisfies ExternalSymbolLinkMappings
