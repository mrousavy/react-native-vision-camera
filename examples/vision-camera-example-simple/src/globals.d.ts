declare global {
  var gc: () => void
  var performance: {
    now: () => number
  }
}

// export so this is treated as a module
export {}
