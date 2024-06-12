type ImportType = ReturnType<typeof require>

/**
 * Create a lazily-imported module proxy.
 * This is useful for lazily requiring optional dependencies.
 */
export const createModuleProxy = <TModule>(getModule: () => ImportType): TModule => {
  const holder: { module: TModule | undefined } = { module: undefined }

  const proxy = new Proxy(holder, {
    get: (target, property) => {
      if (property === '$$typeof') {
        // If inlineRequires is enabled, Metro will look up all imports
        // with the $$typeof operator. In this case, this will throw the
        // `OptionalDependencyNotInstalledError` error because we try to access the module
        // even though we are not using it (Metro does it), so instead we return undefined
        // to bail out of inlineRequires here.
        // See https://github.com/mrousavy/react-native-vision-camera/pull/2953
        return undefined
      }

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
