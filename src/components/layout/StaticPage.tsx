import type { ReactNode } from "react";

export function StaticPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      {intro && <p className="mt-3 text-base text-muted-foreground">{intro}</p>}
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </article>
  );
}
