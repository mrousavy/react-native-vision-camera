import { absoluteUrl, siteConfig } from './site-config'

const SITE_DESCRIPTION =
  'The most powerful Camera library for React Native. Supports Photo and Video capture, QR/Barcode scanning, Frame Processors, and more.'

const AUTHOR = {
  name: 'Marc Rousavy',
  url: 'https://github.com/mrousavy',
}

export function getSiteStructuredData() {
  const siteUrl = absoluteUrl('/')
  const logoUrl = absoluteUrl('/vc_icon.png')

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: siteConfig.name,
        description: SITE_DESCRIPTION,
        inLanguage: 'en',
        publisher: { '@id': `${siteUrl}#person` },
      },
      {
        '@type': 'Person',
        '@id': `${siteUrl}#person`,
        name: AUTHOR.name,
        url: AUTHOR.url,
        image: logoUrl,
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${siteUrl}#software`,
        name: 'react-native-vision-camera',
        description: SITE_DESCRIPTION,
        codeRepository: siteConfig.repositoryUrl,
        programmingLanguage: ['TypeScript', 'Swift', 'Kotlin', 'C++'],
        runtimePlatform: 'React Native',
        license: 'https://opensource.org/licenses/MIT',
        author: { '@id': `${siteUrl}#person` },
        url: siteUrl,
      },
    ],
  }
}

export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
