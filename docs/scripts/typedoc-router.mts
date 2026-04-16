import path from 'node:path'
import {
  type Application,
  type PageDefinition,
  type Reflection,
  ReflectionKind,
  Slugger,
} from 'typedoc'
import { type MarkdownRenderer, MemberRouter } from 'typedoc-plugin-markdown'
import { sectionSlugs } from '../config/api-reference.ts'
import {
  createHybridInterfaceResolver,
  isCallableVariableReflection,
  isViewFunctionReflection,
  isViewVariableReflection,
} from './typedoc-reflection-classification.mts'

function removeFirstScopedDirectory(
  urlString: string,
  separator = path.sep,
): string {
  const pathParts = urlString.replace(/\//g, path.sep).split(separator)
  const scopedDirectoryIndex = pathParts.findIndex((part) =>
    part.startsWith('@'),
  )
  if (scopedDirectoryIndex !== -1) {
    pathParts.splice(scopedDirectoryIndex, 1)
  }

  return pathParts.join(separator)
}

function replaceDirectorySegment(
  directory: string,
  fromSegment: string,
  toSegment: string,
): string {
  if (directory.length === 0) {
    return directory
  }

  const segments = directory.split('/')
  const segmentIndex = segments.lastIndexOf(fromSegment)
  if (segmentIndex < 0) {
    return directory
  }

  segments[segmentIndex] = toSegment
  return segments.join('/')
}

class VisionCameraRouter extends MemberRouter {
  hybridResolverByProject = new WeakMap<
    Reflection['project'],
    ReturnType<typeof createHybridInterfaceResolver>
  >()

  buildChildPages(reflection: Reflection, outPages: PageDefinition[]): void {
    const kind = this.getPageKind(reflection)
    if (kind == null) {
      if (reflection.parent != null) {
        this.buildAnchors(reflection, reflection.parent)
      }
      return
    }

    const shouldWritePage = this.shouldWriteReflectionPage(reflection)
    const idealName = this.getIdealBaseName(reflection)
    const actualName = shouldWritePage
      ? this.getFileName(idealName)
      : `${idealName}${this.extension}`

    this.fullUrls.set(reflection, actualName)

    const reflectionKind = this.kindsToString.get(reflection.kind)
    if (
      reflectionKind != null &&
      ['Module', 'Namespace', 'Document', ...this.membersWithOwnFile].includes(
        reflectionKind,
      )
    ) {
      if (shouldWritePage) {
        this.sluggers.set(reflection, new Slugger(this.sluggerConfiguration))
        outPages.push({
          kind,
          model: reflection,
          url: actualName,
        })
      }
    } else if (reflection.parent != null) {
      this.buildAnchors(reflection, reflection.parent)
    }

    reflection.traverse((child) => {
      this.buildChildPages(child, outPages)
      return true
    })
  }

  getIdealBaseName(reflection: Reflection): string {
    if (this.application.options.getValue('flattenOutputFiles')) {
      return this.getIdealBaseNameFlattened(reflection)
    }

    let directory: string | null = null
    let fileName = ''

    switch (reflection.kind) {
      case ReflectionKind.Module:
        directory = this.resolveModuleDirectory(reflection)
        fileName = this.resolveModuleFileName(reflection)
        break
      case ReflectionKind.Namespace:
        directory = this.resolveNamespaceDirectory(reflection)
        fileName = this.entryFileName
        break
      case ReflectionKind.Document:
        directory = this.resolveDocumentDirectory(reflection)
        fileName = this.getReflectionAlias(reflection)
        break
      default:
        directory = this.resolveReflectionDirectory(reflection)
        fileName = this.resolveReflectionFileName(reflection)
        break
    }

    let fullName = path
      .join(
        [directory, fileName]
          .filter((part): part is string => !!part)
          .join('/'),
      )
      .replace(/\\/g, '/')
      .replace(/ /g, '-')

    if (this.ignoreScopes) {
      fullName = removeFirstScopedDirectory(fullName)
    }

    return fullName
  }

  private isMarkdownRenderer(
    renderer: Application['renderer'],
  ): renderer is MarkdownRenderer {
    return 'packagesMeta' in renderer
  }

  private getRendererPackagesMeta(): Record<
    string,
    {
      options?: {
        isSet(name: string): boolean
        getValue(name: string): unknown
      }
    }
  > {
    const renderer = this.application.renderer
    return this.isMarkdownRenderer(renderer) ? renderer.packagesMeta : {}
  }

  private getReflectionChildren(reflection: Reflection): Reflection[] {
    return 'children' in reflection && Array.isArray(reflection.children)
      ? reflection.children
      : []
  }

  private shouldWriteReflectionPage(reflection: Reflection): boolean {
    if (this.isPackages) {
      const meta = this.getRendererPackagesMeta()[reflection.name]
      const hasEntryModule =
        meta?.options?.isSet('entryModule') &&
        Boolean(
          this.getReflectionChildren(reflection).find(
            (child) => child.name === meta.options?.getValue('entryModule'),
          ),
        )
      if (meta != null) {
        return !hasEntryModule
      }
    }

    if (reflection.name === this.entryModule) {
      return false
    }

    return true
  }

  private resolveModuleDirectory(reflection: Reflection): string | null {
    if (this.entryModule && reflection.name === this.entryModule) {
      return null
    }

    if (reflection.parent?.kind === ReflectionKind.Module) {
      if (this.isPackages) {
        const meta = this.getRendererPackagesMeta()[reflection.parent.name]
        const packageEntryModule = meta?.options?.getValue('entryModule')
        if (packageEntryModule === reflection.name) {
          return this.getReflectionAlias(reflection.parent)
        }
      }

      return `${this.getReflectionAlias(reflection.parent)}/${this.getReflectionAlias(reflection)}`
    }

    return this.getReflectionAlias(reflection)
  }

  private resolveModuleFileName(reflection: Reflection): string {
    if (this.isPackages) {
      const packageEntryModule = this.resolvePackageEntryModule(reflection)
      if (packageEntryModule != null) {
        return this.resolveModuleFileName(packageEntryModule)
      }
    }

    if (reflection.parent?.kind === ReflectionKind.Module && this.isPackages) {
      const meta = this.getRendererPackagesMeta()[reflection.parent.name]
      const packageEntryModule = meta?.options?.getValue('entryModule')
      const packageEntryFileName = meta?.options?.getValue('entryFileName')
      if (
        packageEntryModule === reflection.name &&
        typeof packageEntryFileName === 'string'
      ) {
        return packageEntryFileName
      }
    }

    return this.entryFileName
  }

  private resolveNamespaceDirectory(reflection: Reflection): string {
    if (reflection.parent == null) {
      return this.getReflectionAlias(reflection)
    }

    return `${this.getIdealBaseName(reflection.parent).replace(/\/[^/]+$/, '')}/${this.directories.get(ReflectionKind.Namespace)}/${this.getReflectionAlias(reflection)}`
  }

  private resolveDocumentDirectory(reflection: Reflection): string {
    if (
      reflection.parent != null &&
      reflection.parent.kind !== ReflectionKind.Project
    ) {
      return `${this.getIdealBaseName(reflection.parent).replace(/\/[^/]+$/, '')}/${this.directories.get(ReflectionKind.Document)}`
    }

    return `${this.directories.get(ReflectionKind.Document)}`
  }

  private resolveReflectionDirectory(reflection: Reflection): string {
    if (reflection.parent == null) {
      return ''
    }

    if (reflection.parent.kind === ReflectionKind.Namespace) {
      return `${this.getIdealBaseName(reflection.parent).replace(/\/[^/]+$/, '')}/${this.directories.get(reflection.kind)}`
    }

    if (reflection.parent.kind === ReflectionKind.Module) {
      if (this.entryModule && reflection.parent.name === this.entryModule) {
        return `${this.getReflectionAlias(reflection.parent)}/${this.getDirectoryForReflection(reflection)}`
      }

      if (this.isPackages && reflection.parent.parent != null) {
        const meta =
          this.getRendererPackagesMeta()[reflection.parent.parent.name]
        const packageEntryModule = meta?.options?.getValue('entryModule')
        if (packageEntryModule === reflection.parent.name) {
          return `${this.getReflectionAlias(reflection.parent.parent)}/${this.getReflectionAlias(reflection.parent)}/${this.getDirectoryForReflection(reflection)}`
        }
      }

      return `${this.getIdealBaseName(reflection.parent).replace(/\/[^/]+$/, '')}/${this.getDirectoryForReflection(reflection)}`
    }

    if (reflection.parent.kind === ReflectionKind.Project) {
      return this.getDirectoryForReflection(reflection)
    }

    return `${this.getReflectionAlias(reflection.parent)}/${this.getDirectoryForReflection(reflection)}`
  }

  private getDirectoryForReflection(reflection: Reflection): string {
    const baseDirectory = this.directories.get(reflection.kind) ?? ''

    if (reflection.kind === ReflectionKind.Function) {
      if (isViewFunctionReflection(reflection)) {
        return replaceDirectorySegment(
          baseDirectory,
          sectionSlugs.functions,
          sectionSlugs.views,
        )
      }

      return baseDirectory
    }

    if (reflection.kind === ReflectionKind.Interface) {
      const resolver = this.getHybridResolver(reflection.project)
      if (resolver?.(reflection)) {
        return replaceDirectorySegment(
          baseDirectory,
          sectionSlugs.interfaces,
          sectionSlugs.hybridObjects,
        )
      }

      return baseDirectory
    }

    if (reflection.kind === ReflectionKind.Variable) {
      if (isViewVariableReflection(reflection)) {
        return replaceDirectorySegment(
          baseDirectory,
          sectionSlugs.variables,
          sectionSlugs.views,
        )
      }

      if (isCallableVariableReflection(reflection)) {
        return replaceDirectorySegment(
          baseDirectory,
          sectionSlugs.variables,
          sectionSlugs.functions,
        )
      }
    }

    return baseDirectory
  }

  private resolveReflectionFileName(reflection: Reflection): string {
    return this.getReflectionAlias(reflection)
  }

  private resolvePackageEntryModule(
    reflection: Reflection,
  ): Reflection | undefined {
    const meta = this.getRendererPackagesMeta()[reflection.name]
    if (meta?.options?.isSet('entryModule')) {
      return this.getReflectionChildren(reflection).find(
        (child) => child.name === meta.options?.getValue('entryModule'),
      )
    }

    return undefined
  }

  private getHybridResolver(
    project: Reflection['project'],
  ): ReturnType<typeof createHybridInterfaceResolver> {
    const existing = this.hybridResolverByProject.get(project)
    if (existing != null) {
      return existing
    }

    const resolver = createHybridInterfaceResolver(project)
    this.hybridResolverByProject.set(project, resolver)
    return resolver
  }
}

export function load(app: Application): void {
  app.renderer.defineRouter('vision-camera', VisionCameraRouter)
}
