export type ApiReferenceConfig = {
  hybridObjectsTitle: string
  sectionSlugs: Record<string, string>
  sectionNameByKey: Record<string, string>
  sectionPriority: Record<string, number>
  hybridObjectSectionKeys: readonly string[]
}

export const apiReferenceConfig = {
  hybridObjectsTitle: 'HybridObjects',
  sectionSlugs: {
    hybridObjects: 'hybrid-objects',
    views: 'views',
    functions: 'functions',
    interfaces: 'interfaces',
    typeAliases: 'type-aliases',
    variables: 'variables',
  },
  sectionNameByKey: {
    hybridobjects: 'HybridObjects',
    typealiases: 'Type aliases',
  },
  sectionPriority: {
    hybridobjects: 0,
    views: 1,
    functions: 2,
    interfaces: 3,
    typealiases: 4,
    variables: 5,
  },
  hybridObjectSectionKeys: ['hybridobjects'],
} satisfies ApiReferenceConfig

export const sectionSlugs = apiReferenceConfig.sectionSlugs
