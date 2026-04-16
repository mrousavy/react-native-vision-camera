import {
  type Application,
  type Comment,
  type CommentDisplayPart,
  type DeclarationReflection,
  i18n,
  type Options,
  type ParameterReflection,
  type Reflection,
  ReflectionKind,
  type ReflectionType,
  type SignatureReflection,
  type SomeType,
  translateTagName,
} from 'typedoc'
import {
  type MarkdownPageEvent,
  MarkdownTheme,
  MarkdownThemeContext,
} from 'typedoc-plugin-markdown'
import { shouldSuppressInheritedTypeLevelComment } from '../src/lib/typedoc/inherited-type-level-comments.ts'

type CommentTag = {
  tag: string
  content: CommentDisplayPart[]
}

type CommentRenderOptions = {
  headingLevel?: number
  showSummary?: boolean
  showTags?: boolean
  showReturns?: boolean
  isTableColumn?: boolean
}

type SignatureRenderOptions = {
  headingLevel?: number
  hideTitle?: boolean
  accessor?: string
  nested?: boolean
  multipleSignatures?: boolean
  isTableColumn?: boolean
}

type ParameterEntry = {
  name: string
  description: string
}

type ParameterNode = Pick<DeclarationReflection, 'comment' | 'name' | 'type'>

const FLAGS_NOT_RENDERED = new Set([
  '@showCategories',
  '@showGroups',
  '@hideCategories',
  '@hideGroups',
  '@disableGroups',
])

const ADMONITION_TAGS = new Map<string, { kind: string; title: string }>([
  ['@note', { kind: 'NOTE', title: 'Note' }],
  ['@throws', { kind: 'WARNING', title: 'Throws' }],
])

function toHeading(level: number, title: string): string {
  const normalizedLevel = Math.max(1, Math.min(6, Math.trunc(level)))
  return `${'#'.repeat(normalizedLevel)} ${title}`
}

function toUnorderedList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n')
}

function toInlineCode(text: string): string {
  return `\`${text}\``
}

function toBold(text: string): string {
  return `**${text}**`
}

function toCodeBlock(code: string): string {
  return `\`\`\`ts\n${code}\n\`\`\``
}

function stripTrailingSemicolonInCodeBlock(markdown: string): string {
  if (typeof markdown !== 'string') {
    return markdown
  }

  return markdown.replace(/;(\r?\n```)\s*$/, '$1')
}

function toMarkdownTable(headers: string[], rows: string[][]): string {
  const escapeCell = (value: string): string =>
    String(value).replace(/\|/g, '\\|')
  const headerRow = `| ${headers.map(escapeCell).join(' | ')} |`
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`
  const bodyRows = rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`)
  return [headerRow, separatorRow, ...bodyRows].join('\n')
}

function toCallout(kind: string, title: string, content: string): string {
  const trimmed = content.trim()
  if (trimmed.length === 0) {
    return `> [!${kind}] ${title}`
  }

  const lines = trimmed.split('\n')
  const quoted = lines
    .map((line) => (line.length > 0 ? `> ${line}` : '>'))
    .join('\n')
  return `> [!${kind}] ${title}\n${quoted}`
}

function normalizeHeadingLevel(level: unknown, fallback = 4): number {
  if (typeof level !== 'number' || Number.isNaN(level)) {
    return fallback
  }

  return Math.max(1, Math.min(6, Math.trunc(level)))
}

function toTitleCase(text: string): string {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function mergeExampleTags(tags: CommentTag[]): CommentTag[] {
  const merged: CommentTag[] = []
  for (const tag of tags) {
    if (tag.tag === '@example') {
      const previousIndex = merged.findIndex((item) =>
        ['@example', '@examples'].includes(item.tag),
      )
      if (previousIndex >= 0) {
        const previous = merged[previousIndex]
        tag.content.unshift({ kind: 'text', text: '\n\n' })
        merged[previousIndex] = {
          ...previous,
          tag: '@examples',
          content: [...previous.content, ...tag.content],
        }
        continue
      }
    }

    merged.push(tag)
  }

  return merged
}

function getDetailHeadingLevel(level: unknown): number {
  return Math.max(4, normalizeHeadingLevel(level, 4))
}

function getTypeName(
  type: SomeType | Record<string, unknown> | null | undefined,
): string {
  if (type == null || typeof type !== 'object') {
    return ''
  }

  if ('name' in type && typeof type.name === 'string' && type.name.length > 0) {
    return type.name
  }

  if (
    'qualifiedName' in type &&
    typeof type.qualifiedName === 'string' &&
    type.qualifiedName.length > 0
  ) {
    return type.qualifiedName
  }

  if (
    'reflection' in type &&
    type.reflection != null &&
    typeof type.reflection === 'object' &&
    'name' in type.reflection &&
    typeof type.reflection.name === 'string' &&
    type.reflection.name.length > 0
  ) {
    return type.reflection.name
  }

  if (typeof type.toString === 'function') {
    const value = String(type.toString())
    if (value.length > 0) {
      return value
    }
  }

  return ''
}

function normalizeDeclarationType(typeText: unknown): string {
  if (typeof typeText !== 'string') {
    return ''
  }

  const normalized = typeText
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`/g, '')
    .replace(/\\</g, '<')
    .replace(/\\>/g, '>')
    .replace(/\\\|/g, '|')
    .replace(/\s+/g, ' ')
    .trim()

  if (/^HybridObject(?:\b|<)/.test(normalized)) {
    return 'HybridObject'
  }

  return normalized
}

/** Not declared in typedoc's types but set at runtime on some reflections. */
function getOriginalName(
  model: DeclarationReflection & { originalName?: string },
): string | undefined {
  return typeof model.originalName === 'string' && model.originalName.length > 0
    ? model.originalName
    : undefined
}

function renderDeclarationCodeBlock(
  model: DeclarationReflection | null | undefined,
): string | null {
  const keyword =
    model?.kind === ReflectionKind.Interface
      ? 'interface'
      : model?.kind === ReflectionKind.Class
        ? 'class'
        : null

  if (keyword == null || model == null) {
    return null
  }

  const declarationName = getOriginalName(model) ?? model.name

  if (typeof declarationName !== 'string' || declarationName.length === 0) {
    return null
  }

  const extendedTypes = Array.isArray(model.extendedTypes)
    ? model.extendedTypes
        .map((type) => normalizeDeclarationType(getTypeName(type)))
        .filter((type) => type.length > 0 && type !== declarationName)
    : []

  const uniqueExtendedTypes = [...new Set(extendedTypes)]
  const extendsClause =
    uniqueExtendedTypes.length > 0
      ? ` extends ${uniqueExtendedTypes.join(', ')}`
      : ''

  return toCodeBlock(`${keyword} ${declarationName}${extendsClause}`)
}

function shouldRenderParametersAsTable(
  helpers: MarkdownThemeContext['helpers'] | null | undefined,
): boolean {
  if (helpers == null) {
    return false
  }
  const helper = helpers.useTableFormat
  if (typeof helper !== 'function') {
    return false
  }

  return Boolean(helper.call(helpers, 'parameters'))
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

function isReflectionType(type: SomeType | undefined): type is ReflectionType {
  return type?.type === 'reflection'
}

function getParameterChildren(
  parameter: ParameterNode,
): DeclarationReflection[] {
  const parameterType = parameter.type
  if (!isReflectionType(parameterType)) {
    return []
  }

  return parameterType.declaration.children ?? []
}

function toTagName(value: string): `@${string}` {
  return value.startsWith('@') ? `@${value.slice(1)}` : `@${value}`
}

class VisionCameraThemeContext extends MarkdownThemeContext {
  constructor(
    theme: MarkdownTheme,
    page: MarkdownPageEvent<Reflection>,
    options: Options,
  ) {
    super(theme, page, options)
    this.installOverrides()
  }

  installOverrides(): void {
    const originalPartials = {
      comment: this.partials.comment,
      declaration: this.partials.declaration,
      declarationTitle: this.partials.declarationTitle,
      inheritance: this.partials.inheritance,
      memberWithGroups: this.partials.memberWithGroups,
      signatureTitle: this.partials.signatureTitle,
    }

    this.partials.accessor = (model, options) =>
      this.renderAccessor(model, options)

    this.partials.comment = (model, options = {}) =>
      this.renderComment(model, options)

    this.partials.declarationTitle = (model) =>
      stripTrailingSemicolonInCodeBlock(
        originalPartials.declarationTitle(model),
      )

    this.partials.signature = (model, options) =>
      this.renderSignature(model, options)

    this.partials.signatureTitle = (model, options = {}) =>
      stripTrailingSemicolonInCodeBlock(
        originalPartials.signatureTitle(model, options),
      )

    const signatureReturns: typeof this.partials.signatureReturns = (
      model,
      options,
    ) => this.renderSignatureReturns(model, options)
    this.partials.signatureReturns = signatureReturns

    this.partials.parametersList = (model, options) =>
      this.renderParametersList(model, options)

    const parametersTable: typeof this.partials.parametersTable = (model) =>
      this.renderParametersTable(model)
    this.partials.parametersTable = parametersTable

    const declaration: typeof this.partials.declaration = (
      model,
      options = { headingLevel: 4 },
    ) =>
      originalPartials.declaration(model, {
        ...options,
        headingLevel: getDetailHeadingLevel(options.headingLevel),
      })
    this.partials.declaration = declaration

    const inheritance: typeof this.partials.inheritance = (model, options) => {
      if (options.headingLevel === -1) {
        return originalPartials.inheritance(model, options)
      }

      return originalPartials.inheritance(model, {
        ...options,
        headingLevel: getDetailHeadingLevel(options.headingLevel),
      })
    }
    this.partials.inheritance = inheritance

    this.partials.memberWithGroups = (model, options) =>
      this.renderMemberWithGroups(model, options)
  }

  renderComment(model: Comment, options: CommentRenderOptions = {}): string {
    const headingLevel: number | undefined = options.headingLevel
    const opts = {
      headingLevel,
      showSummary: true,
      showTags: true,
      showReturns: false,
      isTableColumn: false,
      ...options,
    }

    const markdown: string[] = []

    if (opts.showSummary) {
      const flags: string[] = []
      for (const tag of model.modifierTags) {
        if (!FLAGS_NOT_RENDERED.has(tag)) {
          flags.push(toBold(toInlineCode(toTitleCase(tag.slice(1)))))
        }
      }

      if (flags.length > 0) {
        markdown.push(flags.join(' '))
      }

      if (model.summary?.length > 0) {
        markdown.push(this.helpers.getCommentParts(model.summary))
      }
    }

    const blockTagsPreserveOrder = readStringArray(
      this.options.getValue('blockTagsPreserveOrder'),
    )
    const showTags =
      opts.showTags || (opts.showSummary && blockTagsPreserveOrder.length > 0)

    if (showTags && model.blockTags?.length > 0) {
      const filteredTags = mergeExampleTags([...model.blockTags])
        .filter((tag) => {
          const notRenderedTags = readStringArray(
            this.options.getValue('notRenderedTags'),
          )
          if (notRenderedTags.includes(tag.tag)) {
            return false
          }
          if (!opts.showReturns && tag.tag === '@returns') {
            return false
          }
          return true
        })
        .filter((tag) => {
          if (opts.isTableColumn && tag.tag === '@defaultValue') {
            return false
          }

          if (
            !opts.isTableColumn &&
            !(opts.showSummary && opts.showTags) &&
            blockTagsPreserveOrder.length > 0
          ) {
            if (opts.showSummary) {
              return blockTagsPreserveOrder.includes(tag.tag)
            }
            return !blockTagsPreserveOrder.includes(tag.tag)
          }

          return true
        })

      const detailHeadingLevel = getDetailHeadingLevel(opts.headingLevel)

      const renderedTags = filteredTags.map((tag) => {
        const tagText = translateTagName(toTagName(tag.tag))
        const content = this.helpers.getCommentParts(tag.content).trim()
        const admonition = ADMONITION_TAGS.get(tag.tag)
        if (admonition != null && !opts.isTableColumn) {
          return toCallout(admonition.kind, admonition.title, content)
        }

        if (opts.headingLevel != null) {
          if (content.length === 0) {
            return toHeading(detailHeadingLevel, tagText)
          }
          return `${toHeading(detailHeadingLevel, tagText)}\n\n${content}`
        }

        if (content.length === 0) {
          return toBold(tagText)
        }
        return `${toBold(tagText)}\n\n${content}`
      })

      if (renderedTags.length > 0) {
        markdown.push(renderedTags.join('\n\n'))
      }
    }

    return markdown.filter((line) => line.length > 0).join('\n\n')
  }

  renderSignatureReturns(
    model: SignatureReflection,
    options?: SignatureRenderOptions,
  ): string {
    const returnsTag = model.comment?.getTag('@returns')
    if (returnsTag == null) {
      return ''
    }

    const returnsText = this.helpers.getCommentParts(returnsTag.content).trim()
    if (returnsText.length === 0) {
      return ''
    }

    const headingLevel = getDetailHeadingLevel(options?.headingLevel)
    return `${toHeading(headingLevel, i18n.theme_returns())}\n\n${returnsText}`
  }

  renderSignature(
    model: SignatureReflection,
    options: SignatureRenderOptions = {},
  ): string {
    const opts = {
      ...options,
      headingLevel: getDetailHeadingLevel(options?.headingLevel),
    }
    const markdown: string[] = []
    const renderParametersAsTable = shouldRenderParametersAsTable(this.helpers)

    if (!opts.hideTitle) {
      markdown.push(
        this.partials.signatureTitle(model, {
          accessor: opts.accessor,
        }),
      )
    }

    if (
      !opts.nested &&
      model.sources &&
      !this.options.getValue('disableSources')
    ) {
      markdown.push(this.partials.sources(model))
    }

    const modelComments = opts.multipleSignatures
      ? model.comment
      : model.comment || model.parent?.comment
    if (modelComments) {
      markdown.push(
        this.partials.comment(modelComments, {
          headingLevel: opts.headingLevel,
          showTags: false,
          showSummary: true,
        }),
      )
    }

    if (!opts.multipleSignatures && model.parent?.documents) {
      markdown.push(
        this.partials.documents(model.parent, {
          headingLevel: opts.headingLevel,
        }),
      )
    }

    if (
      model.typeParameters?.length &&
      model.kind !== ReflectionKind.ConstructorSignature
    ) {
      markdown.push(
        toHeading(
          opts.headingLevel,
          ReflectionKind.pluralString(ReflectionKind.TypeParameter),
        ),
      )
      if (renderParametersAsTable) {
        markdown.push(this.partials.typeParametersTable(model.typeParameters))
      } else {
        markdown.push(
          this.partials.typeParametersList(model.typeParameters, {
            headingLevel: opts.headingLevel,
          }),
        )
      }
    }

    const documentedParameters = this.getDocumentedParameterEntries(
      model.parameters ?? [],
      {
        headingLevel: opts.headingLevel,
      },
    )
    if (documentedParameters.length > 0) {
      markdown.push(
        toHeading(
          opts.headingLevel,
          ReflectionKind.pluralString(ReflectionKind.Parameter),
        ),
      )
      if (renderParametersAsTable) {
        markdown.push(
          this.renderParametersTableFromEntries(documentedParameters),
        )
      } else {
        markdown.push(
          this.renderParametersListFromEntries(documentedParameters, {
            headingLevel: opts.headingLevel,
          }),
        )
      }
    }

    if (model.type) {
      markdown.push(
        this.partials.signatureReturns(model, {
          headingLevel: opts.headingLevel,
        }),
      )
    }

    if (modelComments) {
      markdown.push(
        this.partials.comment(modelComments, {
          headingLevel: opts.headingLevel,
          showTags: true,
          showSummary: false,
        }),
      )
    }

    markdown.push(
      this.partials.inheritance(model, {
        headingLevel: opts.headingLevel,
      }),
    )
    return markdown.filter((line) => line.length > 0).join('\n\n')
  }

  renderAccessor(
    model: DeclarationReflection,
    options: SignatureRenderOptions = {},
  ): string {
    const headingLevel = getDetailHeadingLevel(options?.headingLevel)
    const markdown: string[] = []
    const showSources = model?.parent?.kind !== ReflectionKind.TypeLiteral
    const renderParametersAsTable = shouldRenderParametersAsTable(this.helpers)

    if (model.getSignature) {
      markdown.push(toHeading(headingLevel, i18n.kind_get_signature()))
      markdown.push(
        this.partials.signatureTitle(model.getSignature, {
          accessor: 'get',
        }),
      )

      if (
        showSources &&
        !this.options.getValue('disableSources') &&
        model.getSignature.sources
      ) {
        markdown.push(this.partials.sources(model.getSignature))
      }

      if (model.getSignature.comment) {
        markdown.push(
          this.partials.comment(model.getSignature.comment, {
            headingLevel: headingLevel + 1,
          }),
        )
      }

      if (model.getSignature.type) {
        markdown.push(
          this.partials.signatureReturns(model.getSignature, {
            headingLevel: headingLevel + 1,
          }),
        )
      }
    }

    if (model.setSignature) {
      markdown.push(toHeading(headingLevel, i18n.kind_set_signature()))
      markdown.push(
        this.partials.signatureTitle(model.setSignature, {
          accessor: 'set',
        }),
      )

      if (
        showSources &&
        !this.options.getValue('disableSources') &&
        model.setSignature.sources
      ) {
        markdown.push(this.partials.sources(model.setSignature))
      }

      if (model.setSignature.comment) {
        markdown.push(
          this.partials.comment(model.setSignature.comment, {
            headingLevel: headingLevel + 1,
          }),
        )
      }

      const documentedParameters = this.getDocumentedParameterEntries(
        model.setSignature.parameters ?? [],
        {
          headingLevel: headingLevel + 1,
        },
      )
      if (documentedParameters.length > 0) {
        markdown.push(
          toHeading(
            headingLevel + 1,
            ReflectionKind.pluralString(ReflectionKind.Parameter),
          ),
        )
        if (renderParametersAsTable) {
          markdown.push(
            this.renderParametersTableFromEntries(documentedParameters),
          )
        } else {
          markdown.push(
            this.renderParametersListFromEntries(documentedParameters, {
              headingLevel: headingLevel + 1,
            }),
          )
        }
      }

      if (model.setSignature.type) {
        markdown.push(
          this.partials.signatureReturns(model.setSignature, {
            headingLevel: headingLevel + 1,
          }),
        )
      }
    }

    if (
      showSources &&
      !this.options.getValue('disableSources') &&
      !model.getSignature &&
      !model.setSignature
    ) {
      markdown.push(this.partials.sources(model))
    }

    if (model.comment) {
      markdown.push(
        this.partials.comment(model.comment, {
          headingLevel,
        }),
      )
    }

    markdown.push(
      this.partials.inheritance(model, {
        headingLevel,
      }),
    )
    return markdown.filter((line) => line.length > 0).join('\n\n')
  }

  getFlattenedParameters(
    parameters: readonly ParameterReflection[],
  ): ParameterNode[] {
    const flattened: ParameterNode[] = []

    const collect = (parameter: ParameterNode, pathPrefix = ''): void => {
      const parameterName =
        pathPrefix.length > 0
          ? `${pathPrefix}.${parameter.name}`
          : parameter.name
      flattened.push({
        ...parameter,
        name: parameterName,
      })

      const children = getParameterChildren(parameter)
      if (children.length === 0) {
        return
      }

      for (const child of children) {
        collect(child, parameterName)
      }
    }

    parameters.forEach((parameter) => {
      collect(parameter)
    })

    return flattened
  }

  getParameterDescription(
    parameter: ParameterNode,
    options: CommentRenderOptions = {},
  ): string {
    if (parameter.comment == null) {
      return ''
    }

    return this.partials.comment(parameter.comment, {
      headingLevel: options?.headingLevel,
      showSummary: true,
      showTags: false,
      isTableColumn: options?.isTableColumn ?? false,
    })
  }

  getDocumentedParameterEntries(
    parameters: readonly ParameterReflection[],
    options: CommentRenderOptions = {},
  ): ParameterEntry[] {
    return this.getFlattenedParameters(parameters)
      .map((parameter) => {
        const description = this.getParameterDescription(
          parameter,
          options,
        ).trim()
        return {
          name: parameter.name,
          description,
        }
      })
      .filter((entry) => entry.description.length > 0)
  }

  renderParametersList(
    model: readonly ParameterReflection[],
    options: CommentRenderOptions = {},
  ): string {
    const entries = this.getDocumentedParameterEntries(model, options)
    return this.renderParametersListFromEntries(entries, options)
  }

  renderParametersTable(model: readonly ParameterReflection[]): string {
    const entries = this.getDocumentedParameterEntries(model, {
      isTableColumn: true,
    })
    return this.renderParametersTableFromEntries(entries)
  }

  renderParametersListFromEntries(
    entries: ParameterEntry[],
    options: SignatureRenderOptions = {},
  ): string {
    const parameterHeadingLevel =
      normalizeHeadingLevel(options.headingLevel, 4) + 1
    if (entries.length === 0) {
      return ''
    }

    const sections = entries.map((entry) => {
      const heading = toHeading(parameterHeadingLevel, entry.name)
      return `${heading}\n\n${entry.description}`
    })
    return sections.join('\n\n')
  }

  renderParametersTableFromEntries(entries: ParameterEntry[]): string {
    if (entries.length === 0) {
      return ''
    }

    const headers = [
      ReflectionKind.singularString(ReflectionKind.Parameter),
      'Description',
    ]
    const rows = entries.map((entry) => [
      `\`${entry.name}\``,
      entry.description,
    ])
    return toMarkdownTable(headers, rows)
  }

  renderMemberWithGroups(
    model: DeclarationReflection,
    options: { headingLevel: number },
  ): string {
    const markdown: string[] = []

    if (
      model.kind === ReflectionKind.Interface ||
      model.kind === ReflectionKind.Class
    ) {
      const declarationCodeBlock = renderDeclarationCodeBlock(model)
      if (declarationCodeBlock != null) {
        markdown.push(declarationCodeBlock)
      }
    } else if (model.kind === ReflectionKind.TypeAlias) {
      markdown.push(this.partials.declarationTitle(model))
    }

    if (
      ![ReflectionKind.Module, ReflectionKind.Namespace].includes(model.kind) &&
      model.sources &&
      !this.options.getValue('disableSources')
    ) {
      markdown.push(this.partials.sources(model))
    }

    const shouldRenderTypeLevelComment =
      model.comment != null &&
      !shouldSuppressInheritedTypeLevelComment(model, this.page.project)

    if (shouldRenderTypeLevelComment) {
      markdown.push(
        this.partials.comment(model.comment!, {
          headingLevel: options.headingLevel,
        }),
      )
    }

    if (model.extendedBy?.length) {
      const headingLevel = getDetailHeadingLevel(options.headingLevel)
      markdown.push(toHeading(headingLevel, 'Extended by'))
      markdown.push(
        toUnorderedList(
          model.extendedBy.map((extendedType) =>
            this.partials.someType(extendedType),
          ),
        ),
      )
    }

    if (model.typeParameters?.length) {
      markdown.push(
        toHeading(
          options.headingLevel,
          ReflectionKind.pluralString(ReflectionKind.TypeParameter),
        ),
      )
      const parametersFormat = this.options.getValue('parametersFormat')
      if (parametersFormat === 'table' || parametersFormat === 'htmlTable') {
        markdown.push(this.partials.typeParametersTable(model.typeParameters))
      } else {
        markdown.push(
          this.partials.typeParametersList(model.typeParameters, {
            headingLevel: options.headingLevel,
          }),
        )
      }
    }

    if (model.implementedTypes?.length) {
      markdown.push(toHeading(options.headingLevel, i18n.theme_implements()))
      markdown.push(
        toUnorderedList(
          model.implementedTypes.map((implementedType) =>
            this.partials.someType(implementedType),
          ),
        ),
      )
    }

    if (model.kind === ReflectionKind.Class && model.categories?.length) {
      model.groups
        ?.filter((group) => group.title === i18n.kind_plural_constructor())
        .forEach((group) => {
          markdown.push(
            toHeading(options.headingLevel, i18n.kind_plural_constructor()),
          )
          group.children.forEach((child) => {
            if (!('getAllSignatures' in child)) {
              return
            }
            markdown.push(
              this.partials.constructor(child, {
                headingLevel: options.headingLevel + 1,
              }),
            )
          })
        })
    }

    if ('signatures' in model && model.signatures?.length) {
      const multipleSignatures = model.signatures.length > 1
      model.signatures.forEach((signature) => {
        if (multipleSignatures) {
          markdown.push(
            toHeading(options.headingLevel, i18n.kind_call_signature()),
          )
        }
        markdown.push(
          this.partials.signature(signature, {
            headingLevel: multipleSignatures
              ? options.headingLevel + 1
              : options.headingLevel,
          }),
        )
      })
    }

    if (model.indexSignatures?.length) {
      markdown.push(toHeading(options.headingLevel, i18n.theme_indexable()))
      model.indexSignatures.forEach((indexSignature) => {
        markdown.push(
          this.partials.indexSignature(indexSignature, {
            headingLevel: options.headingLevel + 1,
          }),
        )
      })
    }

    markdown.push(
      this.partials.body(model, { headingLevel: options.headingLevel }),
    )
    return markdown.filter((line) => line.length > 0).join('\n\n')
  }
}

class VisionCameraMarkdownTheme extends MarkdownTheme {
  getRenderContext(
    page: MarkdownPageEvent<Reflection>,
  ): VisionCameraThemeContext {
    return new VisionCameraThemeContext(this, page, this.application.options)
  }
}

export function load(app: Application): void {
  app.renderer.defineTheme('vision-camera-markdown', VisionCameraMarkdownTheme)
}
