declare global {
  var performance: {
    now(): number
  }
}

// ensures this file is treated as a module
export {}
