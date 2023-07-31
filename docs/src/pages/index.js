import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';
import { Analytics } from '@vercel/analytics/react'

const features = [
  {
    title: 'Feature-rich',
    imageUrl: './img/example.png',
    description: (
      <>
        VisionCamera was designed from the ground up to provide all features a camera app should have. You have full control over what device is used, and can even configure options such as frame rate, colorspace and more.
      </>
    ),
  },
  {
    title: 'Easy to use',
    imageUrl: './img/example_intro.png',
    description: (
      <>
        While having a lot of features, VisionCamera makes sure you don't get overwhelmed from the beginning. It provides hooks and functions to help you get started faster, and if you need full control, you can easily do that.
      </>
    ),
  },
  {
    title: 'Rich Developer Support',
    imageUrl: './img/example_error.png',
    description: (
      <>
        Every functionality has been thoroughly documented and even errors are fully typed. Use TypeScript to get compile-time feedback on what has went wrong.
      </>
    ),
  },
];

function Feature({imageUrl, title, description}) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={clsx('col col--4', styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;
  return (
    <Layout
      title="VisionCamera Documentation"
      description="📸 The Camera library that sees the vision.">
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={clsx(
                'button button--outline button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/guides/')}>
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main>
        {features && features.length > 0 && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}

        <Analytics />
      </main>
    </Layout>
  );
}

export default Home;
