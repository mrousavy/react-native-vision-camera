module.exports = {
  title: 'VisionCamera',
  tagline: '📸 The Camera library that sees the vision.',
  url: 'https://github.com/cuvent/react-native-vision-camera',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'cuvent',
  projectName: 'react-native-vision-camera',
  themeConfig: {
    navbar: {
      title: 'My Site',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          href: 'https://github.com/cuvent/react-native-vision-camera/blob/main/README.md',
          label: 'Guides',
          position: 'left',
        },
        {to: 'docs/api', label: 'API', position: 'left'},
        {
          href: 'https://github.com/cuvent/react-native-vision-camera',
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
              href: 'https://github.com/cuvent/react-native-vision-camera/blob/main/README.md',
            },
            {
              label: 'API',
              to: 'docs/api',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub discussions',
              href: 'https://github.com/cuvent/react-native-vision-camera/discussions',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/mrousavy',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/cuvent/react-native-vision-camera',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Cuvent`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/cuvent/react-native-vision-camera/edit/main/docs/website/',
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
        entryPoints: ['../../src'],
        tsconfig: '../../tsconfig.json',
        readme: "none",
        out: 'api',
        sidebar: {
          sidebarFile: 'typedoc-sidebar.js',
          fullNames: true,
          readmeLabel: 'Overview'
        },
      },
    ],
  ],
};
