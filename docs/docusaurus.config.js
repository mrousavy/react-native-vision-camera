module.exports = {
  title: 'VisionCamera',
  tagline: '📸 The Camera library that sees the vision.',
  url: 'https://mrousavy.github.io',
  baseUrl: '/react-native-vision-camera/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  favicon: './favicon.ico',
  organizationName: 'mrousavy',
  projectName: 'react-native-vision-camera',
  themeConfig: {
    algolia: {
      apiKey: 'ab7f44570bb62d0e07c0f7d92312ed1a',
      indexName: 'react-native-vision-camera',
    },
    prism: {
      additionalLanguages: ['swift', 'java', 'kotlin'],
    },
    navbar: {
      title: 'VisionCamera',
      logo: {
        alt: 'Logo',
        src: './android-chrome-192x192.png',
      },
      items: [
        {
          label: 'Guides',
          to: 'docs/guides',
          position: 'left',
        },
        {
          to: 'docs/api',
          label: 'API',
          position: 'left'
        },
        {
          href: 'https://github.com/mrousavy/react-native-vision-camera/tree/main/example',
          label: 'Example App',
          position: 'left'
        },
        {
          href: 'https://github.com/mrousavy/react-native-vision-camera',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Guides',
              to: 'docs/guides'
            },
            {
              label: 'API',
              to: 'docs/api',
            },
            {
              label: 'Example App',
              href: 'https://github.com/mrousavy/react-native-vision-camera/tree/main/example',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub discussions',
              href: 'https://github.com/mrousavy/react-native-vision-camera/discussions',
            },
            {
              label: 'Twitter (@mrousavy)',
              href: 'https://twitter.com/mrousavy',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/mrousavy/react-native-vision-camera',
            },
            {
              label: 'Marc\'s Portfolio',
              href: 'https://mrousavy.github.io',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Marc Rousavy`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/mrousavy/react-native-vision-camera/edit/main/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        name: 'VisionCamera',
        entryPoints: ['../src'],
        exclude: "../src/index.ts",
        tsconfig: '../tsconfig.json',
        watch: process.env.TYPEDOC_WATCH,
        excludePrivate: true,
        excludeProtected: true,
        excludeExternals: true,
        excludeInternal: true,
        readme: "none",
        sidebar: {
          indexLabel: 'Overview'
        }
      },
    ],
  ],
};
