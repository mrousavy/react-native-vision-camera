type ImportType = ReturnType<typeof require>;
/**
 * Create a lazily-imported module proxy.
 * This is useful for lazily requiring optional dependencies.
 */
export declare const createModuleProxy: <TModule>(getModule: () => ImportType) => TModule;
export declare class OptionalDependencyNotInstalledError extends Error {
    constructor(name: string);
}
export {};
