import { MarkdownPageEvent } from "typedoc-plugin-markdown";

/**
 * @param {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
export function load(app) {
  app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
    page.frontmatter = {
      title: page.model?.name || "API Reference",
      ...page.frontmatter,
    };
  });
}

