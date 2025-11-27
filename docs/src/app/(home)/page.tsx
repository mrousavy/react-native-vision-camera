import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1 px-4">
      <h1 className="text-4xl font-bold mb-4">📸 VisionCamera</h1>
      <p className="text-fd-muted-foreground text-lg mb-8 max-w-xl mx-auto">
        A powerful, high-performance React Native Camera library.
      </p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/docs"
          className="px-6 py-3 bg-fd-primary text-fd-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Get Started
        </Link>
        <Link
          href="/docs/quick-start"
          className="px-6 py-3 bg-fd-secondary text-fd-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Quick Start
        </Link>
      </div>
    </div>
  );
}
