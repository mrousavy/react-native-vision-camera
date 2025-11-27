import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as FilesComponents from 'fumadocs-ui/components/files';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import type { MDXComponents } from 'mdx/types';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { AutoTypeTable } from 'fumadocs-typescript/ui';
import { createGenerator } from 'fumadocs-typescript';

const generator = createGenerator();

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    ...FilesComponents,
    Accordion,
    Accordions,
    AutoTypeTable: (props) => (
      <AutoTypeTable {...props} generator={generator} />
    ),
    img: (props) => <ImageZoom {...(props as any)} />,
    ...components,
  } satisfies MDXComponents;
}

declare module 'mdx/types.js' {
  // Augment the MDX types to make it understand React.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    type Element = React.JSX.Element;
    type ElementClass = React.JSX.ElementClass;
    type ElementType = React.JSX.ElementType;
    type IntrinsicElements = React.JSX.IntrinsicElements;
  }
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}