import { Fragment, type ReactNode } from "react";
import { MathText } from "@/components/MathTextLazy";
import { parseBlocks, type Block, type Inline } from "@/lib/forum-markdown";

/**
 * Renderar ett foruminlägg.
 *
 * Användarinnehåll passerar aldrig dangerouslySetInnerHTML — texten parsas till
 * ett nodträd i src/lib/forum-markdown.ts och blir React-element här. Matte är
 * undantaget: MathText får en `$…$`-sträng och KaTeX producerar HTML:en, men
 * bara för det som stod mellan dollartecknen.
 *
 * Länkar får rel="nofollow ugc noopener" — användarlänkar ska inte skicka
 * vidare sidans länkkraft, och ugc är vad Google vill se på foruminnehåll.
 */
export function ForumBody({ body, className }: { body: string; className?: string }) {
  const blocks = parseBlocks(body);
  return (
    <div className={className}>
      <BlockList blocks={blocks} />
    </div>
  );
}

function BlockList({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <BlockNode key={i} block={block} />
      ))}
    </>
  );
}

function BlockNode({ block }: { block: Block }) {
  switch (block.kind) {
    case "paragraph":
      return (
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--text-secondary)] [&:not(:first-child)]:mt-3">
          <InlineList nodes={block.children} />
        </p>
      );

    case "quote":
      return (
        <blockquote className="mt-3 border-l-2 border-[var(--amber)]/40 bg-white/[0.02] py-2 pl-3 pr-2 text-[var(--text-tertiary)] first:mt-0">
          <BlockList blocks={block.children} />
        </blockquote>
      );

    case "list":
      return block.ordered ? (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-[15px] leading-relaxed text-[var(--text-secondary)] first:mt-0">
          {block.items.map((item, i) => (
            <li key={i}>
              <InlineList nodes={item} />
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-[var(--text-secondary)] first:mt-0">
          {block.items.map((item, i) => (
            <li key={i}>
              <InlineList nodes={item} />
            </li>
          ))}
        </ul>
      );

    case "code":
      return (
        <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.04] p-3 text-[13px] leading-relaxed first:mt-0">
          <code style={{ fontFamily: "var(--font-mono)" }}>{block.text}</code>
        </pre>
      );
  }
}

function InlineList({ nodes }: { nodes: Inline[] }): ReactNode {
  return (
    <>
      {nodes.map((node, i) => (
        <Fragment key={i}>
          <InlineNode node={node} />
        </Fragment>
      ))}
    </>
  );
}

function InlineNode({ node }: { node: Inline }): ReactNode {
  switch (node.kind) {
    case "text":
      return node.text;

    case "bold":
      return (
        <strong className="font-semibold text-[var(--cream)]">
          <InlineList nodes={node.children} />
        </strong>
      );

    case "italic":
      return (
        <em>
          <InlineList nodes={node.children} />
        </em>
      );

    case "code":
      return (
        <code
          className="rounded bg-white/[0.06] px-1 py-0.5 text-[13px] text-[var(--cream)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {node.text}
        </code>
      );

    case "math":
      return <MathText className="text-[var(--cream)]">{`$${node.text}$`}</MathText>;

    case "link":
      return (
        <a
          href={node.href}
          target="_blank"
          rel="nofollow ugc noopener noreferrer"
          className="break-words text-[var(--teal)] underline decoration-[var(--teal)]/40 underline-offset-2 transition-colors hover:decoration-[var(--teal)]"
        >
          {node.text}
        </a>
      );
  }
}
