import { CodeBlock, CodeBlockActions, CodeBlockContent, CodeBlockCopyButton, CodeBlockHeader, CodeBlockTitle } from "@/components/ai-elements/code-block";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface MarkdownArtifactProps {
  spec: {
    content: string;
  };
}

export function MarkdownArtifact({ spec }: MarkdownArtifactProps) {
  return (
    <div className="prose prose-invert max-w-none p-6">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "text";
            const code = String(children).replace(/\n$/, "");

            if (inline) {
              return (
                <code className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-sm", className)} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock code={code} language={language as any} className="my-4">
                <CodeBlockHeader>
                  <CodeBlockTitle>{language.toUpperCase()}</CodeBlockTitle>
                  <CodeBlockActions>
                    <CodeBlockCopyButton />
                  </CodeBlockActions>
                </CodeBlockHeader>
              </CodeBlock>
            );
          },
          table({ children }) {
            return (
              <div className="my-6 overflow-x-auto rounded-lg border">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="border-b bg-muted/50 px-4 py-2 text-left font-medium">{children}</th>;
          },
          td({ children }) {
            return <td className="border-b px-4 py-2">{children}</td>;
          },
        }}
      >
        {spec.content}
      </ReactMarkdown>
    </div>
  );
}

export function JsonArtifact({ spec }: { spec: { content: string } }) {
  const content = typeof spec.content === 'string' ? spec.content : JSON.stringify(spec.content, null, 2);
  return (
    <div className="p-4">
      <CodeBlock code={content} language="json">
        <CodeBlockHeader>
          <CodeBlockTitle>JSON</CodeBlockTitle>
          <CodeBlockActions>
            <CodeBlockCopyButton />
          </CodeBlockActions>
        </CodeBlockHeader>
      </CodeBlock>
    </div>
  );
}
