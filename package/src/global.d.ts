// eslint-disable-next-line no-var
declare var global: {
  __frameProcessorRunAtTargetFpsMap: Record<string, number | undefined> | undefined
}
// eslint-disable-next-line no-var
declare var performance: {
  now: () => number
}
