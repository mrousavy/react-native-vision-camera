module.exports = {
  visionSidebar: {
    Guides: [
      'guides/setup',
      'guides/devices',
      'guides/formats',
      'guides/capturing',
      'guides/frame-processors',
      {
        type: 'category',
        label: 'Creating Frame Processor Plugins',
        items: [
          'guides/frame-processors-plugins-overview',
          'guides/frame-processors-plugins-ios',
          'guides/frame-processors-plugins-android',
          'guides/frame-processors-plugins-final',
          'guides/frame-processor-plugin-list'
        ]
      },
      'guides/animated',
      'guides/errors',
      'guides/troubleshooting',
    ],
    API: require('./typedoc-sidebar.js'),
  },
};
