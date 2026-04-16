import { CalloutContainer, CalloutTitle } from 'fumadocs-ui/components/callout'
import { CircleAlert } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import type { CalloutStyle } from '@/lib/mdx/types'
import { mergeClassNames } from '@/lib/mdx/utils'

const DEPENDENCY_CALLOUT_TYPE = 'dependency'

function isDependencyCallout(type: string | undefined): boolean {
  return type?.toLowerCase() === DEPENDENCY_CALLOUT_TYPE
}

type MdxCalloutRootProps = ComponentProps<typeof CalloutContainer> & {
  type?: string
}

type MdxCalloutTitleProps = ComponentProps<typeof CalloutTitle> & {
  type?: string
}

function resolveCalloutType(
  type: string | undefined,
): ComponentProps<typeof CalloutContainer>['type'] | undefined {
  switch (type?.toLowerCase()) {
    case 'info':
      return 'info'
    case 'warn':
      return 'warn'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    case 'success':
      return 'success'
    case 'idea':
      return 'idea'
    default:
      return undefined
  }
}

export function MdxCalloutContainer({
  type,
  icon,
  className,
  style,
  ...props
}: MdxCalloutRootProps): ReactNode {
  if (!isDependencyCallout(type)) {
    return (
      <CalloutContainer
        {...props}
        type={resolveCalloutType(type)}
        icon={icon}
        className={className}
      />
    )
  }

  const dependencyCalloutStyle = {
    ...(style ?? {}),
    '--callout-color': 'var(--dependency-callout-accent)',
  } satisfies CalloutStyle

  return (
    <CalloutContainer
      {...props}
      type="info"
      icon={icon ?? <CircleAlert className="dependency-callout-icon" />}
      className={mergeClassNames('dependency-callout', className)}
      style={dependencyCalloutStyle}
    />
  )
}

export function MdxCalloutTitle({
  type,
  children,
  className,
  ...props
}: MdxCalloutTitleProps): ReactNode {
  const isDependency = isDependencyCallout(type)

  return (
    <CalloutTitle
      {...props}
      className={mergeClassNames(
        isDependency ? 'dependency-callout-title' : undefined,
        className,
      )}
    >
      {isDependency ? 'Dependency Required' : children}
    </CalloutTitle>
  )
}
