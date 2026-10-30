import { memo, type MouseEvent, type ReactNode } from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';
import { useData } from '../state/data.tsx';
import { useNav } from '../state/nav.tsx';
import { resolveHref } from '../lib/links.ts';

interface Props {
  source: string;
  /** Path of the document relative to study-content/, used to resolve relative links. */
  base?: string;
  /** Where links inside this Markdown were clicked from. */
  from?: 'main' | 'pane';
  className?: string;
}

// Keep study:// links (react-markdown strips unknown protocols by default).
const urlTransform = (url: string) => (url.startsWith('study://') ? url : defaultUrlTransform(url));

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

function textOf(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(textOf).join('');
  if (children && typeof children === 'object' && 'props' in (children as any)) return textOf((children as any).props.children);
  return '';
}

function MarkdownImpl({ source, base = '', from = 'main', className }: Props) {
  const { course } = useData();
  const { openLink } = useNav();

  const heading =
    (Tag: 'h2' | 'h3' | 'h4') =>
    ({ children }: { children?: ReactNode }) => (
      <Tag id={slug(textOf(children))} data-heading={textOf(children)}>
        {children}
      </Tag>
    );

  return (
    <div className={`md ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }]]}
        urlTransform={urlTransform}
        components={{
          h1: heading('h2'),
          h2: heading('h2'),
          h3: heading('h3'),
          h4: heading('h4'),
          table: ({ children }) => (
            <div className="table-wrap">
              <table>{children}</table>
            </div>
          ),
          a: ({ href = '', children }) => {
            const target = resolveHref(href, base, course);
            const external = !target || target.kind === 'web';
            const onClick = (e: MouseEvent) => {
              if (!target) return; // unknown relative link: let the browser try
              e.preventDefault();
              openLink(target, { from, invert: e.metaKey || e.ctrlKey || e.altKey });
            };
            return (
              <a
                href={href}
                onClick={onClick}
                className={external ? 'ext-link' : 'int-link'}
                target={external && !target ? '_blank' : undefined}
                rel="noreferrer"
                title={
                  target && target.kind !== 'web'
                    ? 'Opens beside the current view (⌘/Ctrl/Alt-click for the other location)'
                    : 'External link — opens in the reference pane or your browser'
                }
              >
                {children}
                {external && <span aria-hidden className="ext-mark">↗</span>}
              </a>
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

export const Markdown = memo(MarkdownImpl);

export function TeX({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: display, strict: 'ignore' });
  return <span className={display ? 'tex-display' : 'tex-inline'} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Inline Markdown (prompts, options, list items): no block wrapper paragraphs. */
export function InlineMd({ source }: { source: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }]]}
      components={{ p: ({ children }) => <>{children}</> }}
    >
      {source}
    </ReactMarkdown>
  );
}
