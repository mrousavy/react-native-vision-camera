type ImportType = ReturnType<typeof require>

/**
 * Create a lazily-imported module proxy.
 * This is useful for lazily requiring optional dependencies.
 */
export const createModuleProxy = <TModule>(name: string, getModule: () => ImportType): TModule => {
  const holder: { module: TModule | undefined } = { module: undefined }

  const proxy = new Proxy(holder, {
    get: (target, property) => {
      if (target.module == null) {
        try {
          target.module = getModule() as TModule
        } catch (e) {
          throw new Error(`${name} is not installed!`)
        }
      }
      return target.module[property as keyof typeof holder.module]
    },
  })
  return proxy as TModule
}
