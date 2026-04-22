import { absoluteUrl, siteConfig } from './site-config'

const SITE_DESCRIPTION =
  'The most powerful Camera library for React Native. Supports Photo and Video capture, QR/Barcode scanning, Frame Processors, and more.'

const AUTHOR = {
  name: 'Marc Rousavy',
  url: 'https://mrousavy.com',
  sameAs: ['https://github.com/mrousavy', 'https://twitter.com/mrousavy'],
} as const

const COMPANY = {
  name: 'Margelo',
  url: 'https://margelo.com',
  id: 'https://margelo.com/#organization',
  sameAs: ['https://github.com/margelo', 'https://x.com/margelo_com'],
} as const

export function getSiteStructuredData() {
  const siteUrl = absoluteUrl('/')
  const logoUrl = absoluteUrl('/vc_icon.png')

  const websiteId = `${siteUrl}#website`
  const projectId = `${siteUrl}#organization`
  const personId = `${siteUrl}#person`
  const softwareId = `${siteUrl}#software`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: siteUrl,
        name: siteConfig.name,
        description: SITE_DESCRIPTION,
        inLanguage: 'en',
        publisher: { '@id': projectId },
        about: { '@id': softwareId },
      },
      {
        '@type': 'Organization',
        '@id': projectId,
        name: siteConfig.name,
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: logoUrl,
          width: 1024,
          height: 1024,
        },
        sameAs: [siteConfig.repositoryUrl],
        founder: { '@id': personId },
        parentOrganization: { '@id': COMPANY.id },
      },
      {
        '@type': 'Organization',
        '@id': COMPANY.id,
        name: COMPANY.name,
        url: COMPANY.url,
        sameAs: [...COMPANY.sameAs],
        founder: { '@id': personId },
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: AUTHOR.name,
        url: AUTHOR.url,
        sameAs: [...AUTHOR.sameAs],
        worksFor: { '@id': COMPANY.id },
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': softwareId,
        name: 'react-native-vision-camera',
        description: SITE_DESCRIPTION,
        codeRepository: siteConfig.repositoryUrl,
        programmingLanguage: ['TypeScript', 'Swift', 'Kotlin', 'C++'],
        runtimePlatform: 'React Native',
        license: 'https://opensource.org/licenses/MIT',
        url: siteUrl,
        author: { '@id': personId },
        publisher: { '@id': projectId },
      },
    ],
  }
}

export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
