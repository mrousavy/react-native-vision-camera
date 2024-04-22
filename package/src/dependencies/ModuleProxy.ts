type ImportType = ReturnType<typeof require>

/**
 * Create a lazily-imported module proxy.
 * This is useful for lazily requiring optional dependencies.
 */
export const createModuleProxy = <TModule>(getModule: () => ImportType): TModule => {
  const holder: { module: TModule | undefined } = { module: undefined }

  const proxy = new Proxy(holder, {
    get: (target, property) => {
      if (target.module == null) {
        // lazy initialize module via require()
        // caller needs to make sure the require() call is wrapped in a try/catch
        target.module = getModule() as TModule
      }
      return target.module[property as keyof typeof holder.module]
    },
  })
  return proxy as unknown as TModule
}

export class OptionalDependencyNotInstalledError extends Error {
  constructor(name: string) {
    super(`${name} is not installed!`)
  }
}
