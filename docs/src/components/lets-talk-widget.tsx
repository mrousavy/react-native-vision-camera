import { ArrowRight } from 'lucide-react'

export function LetsTalkWidget() {
  return (
    <aside className="mt-6 rounded-lg border bg-fd-card p-4 text-sm">
      <p className="font-semibold text-fd-foreground">
        Building something ambitious?
      </p>
      <p className="mt-1 text-fd-muted-foreground">
        We help teams ship world-class React Native apps.
      </p>
      <a
        href="https://margelo.com"
        target="_blank"
        rel="noreferrer noopener"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-fd-primary px-3 py-2 font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/80"
      >
        Let's talk
        <ArrowRight className="size-4" />
      </a>
    </aside>
  )
}
