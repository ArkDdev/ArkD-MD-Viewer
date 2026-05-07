/**
 * Module shims for markdown-it plugins that don't ship their own .d.ts files.
 *
 * Each plugin is declared as a `MarkdownItPlugin` — a function that takes the
 * markdown-it instance plus optional plugin-specific options. We don't try to
 * type the options object precisely; for our use case (just turning the plugin
 * on, sometimes with a single boolean option) `any` is fine and won't surprise
 * anyone in code review.
 */
declare module 'markdown-it-footnote' {
  import type MarkdownIt from 'markdown-it';
  const plugin: (md: MarkdownIt, options?: unknown) => void;
  export default plugin;
}

declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it';
  interface TaskListsOptions {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  }
  const plugin: (md: MarkdownIt, options?: TaskListsOptions) => void;
  export default plugin;
}
