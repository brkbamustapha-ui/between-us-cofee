'use client';

import { useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** Onglets génériques du dashboard (contenu rendu côté serveur en enfants). */
export function PanelSection({
  tabs,
}: {
  tabs: { label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <>
      <div
        role="tablist"
        className="no-scrollbar mb-5 flex gap-1.5 overflow-x-auto rounded-xl border border-line bg-ink/40 p-1.5"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={active === index}
            onClick={() => setActive(index)}
            className={cn(
              'h-9 shrink-0 rounded-lg px-4 text-sm font-medium transition-colors duration-200',
              active === index
                ? 'bg-lime text-on-lime'
                : 'text-fg-muted hover:bg-white/5 hover:text-cream',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs[active]?.content}
    </>
  );
}
