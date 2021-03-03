import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const features = [
  {
    title: 'Easy to use',
    imageUrl: 'https://github.com/cuvent/react-native-vision-camera/blob/main/img/example_intro.png?raw=true',
    description: (
      <>
        While having a lot of features, VisionCamera makes sure you don't get overwhelmed from the beginning. It provides hooks and functions to help you get started faster, and if you need full control, you can easily do that.
      </>
    ),
  },
  {
    title: 'Feature Rich',
    imageUrl: 'https://github.com/cuvent/react-native-vision-camera/blob/main/img/example.png?raw=true',
    description: (
      <>
        VisionCamera was designed from the ground up to provide all features a camera app should have. You have full control over what device is used, and can even configure options such as frame rate, colorspace and more.
      </>
    ),
  },
  {
    title: 'Rich Developer Support',
    imageUrl: 'https://github.com/cuvent/react-native-vision-camera/blob/main/img/example_error.png?raw=true',
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
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={clsx(
                'button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/')}>
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
      </main>
    </Layout>
  );
}

export default Home;
