import { cn } from '@/lib/utils';
import { MENU_BADGE_LABELS, type MenuBadge } from '@/types/content';

const STYLES: Record<MenuBadge, string> = {
  best_seller: 'bg-lime text-on-lime',
  popular: 'bg-clay/90 text-ink',
  new: 'bg-cream text-ink',
  recommended: 'bg-lime/15 text-lime ring-1 ring-lime/35',
};

export function MenuBadgePill({
  badge,
  className,
}: {
  badge: MenuBadge;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-[3px] text-[0.625rem] font-semibold uppercase tracking-[0.09em]',
        STYLES[badge],
        className,
      )}
    >
      {MENU_BADGE_LABELS[badge]}
    </span>
  );
}

/** Pastille d'avertissement pour les emplacements de menu non renseignés. */
export function PlaceholderPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-danger/15 px-2.5 py-[3px] text-[0.625rem] font-semibold uppercase tracking-[0.09em] text-danger ring-1 ring-danger/30',
        className,
      )}
    >
      À renseigner
    </span>
  );
}
