import Link from 'next/link'
import { featuredGuideLinks } from '@/lib/featured-guide-links'

export function FeaturedGuideLinks({ currentUrl }: { currentUrl?: string }) {
  return (
    <nav
      aria-labelledby="featured-guide-links-heading"
      className="not-prose mt-8 border-t pt-5"
    >
      <p
        id="featured-guide-links-heading"
        className="text-sm font-medium text-fd-muted-foreground"
      >
        Guides
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {featuredGuideLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={currentUrl === link.href ? 'page' : undefined}
              className="inline-flex rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground aria-[current=page]:border-fd-primary/40 aria-[current=page]:text-fd-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
