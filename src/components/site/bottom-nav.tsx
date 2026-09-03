'use client';

import { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Croissant,
  Home,
  MessageCircle,
  UtensilsCrossed,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Barre de navigation basse, mobile uniquement.
 *
 * Cinq destinations, cibles tactiles de 56 px, et un état actif suivi par
 * IntersectionObserver — l'onglet correspond toujours à la section réellement à
 * l'écran, sans écouteur de scroll ni calcul de position.
 */

interface Item {
  href: string;
  label: string;
  icon: typeof Home;
}

const ITEMS: Item[] = [
  { href: '#accueil', label: 'Accueil', icon: Home },
  { href: '#menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '#brunch', label: 'Brunch', icon: Croissant },
  { href: '#reservation', label: 'Réserver', icon: CalendarCheck },
  { href: '#contact', label: 'Contact', icon: MessageCircle },
];

export function BottomNav({
  reservationEnabled,
}: {
  reservationEnabled: boolean;
}) {
  const [active, setActive] = useState('#accueil');
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    // Ne garder que les ancres réellement présentes : une section masquée
    // depuis le dashboard ne doit pas laisser un onglet mort.
    const available = ITEMS.filter(
      (item) =>
        document.querySelector(item.href) &&
        (item.href !== '#reservation' || reservationEnabled),
    );
    setItems(available);

    if (available.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(`#${visible.target.id}`);
      },
      // Bande centrale de l'écran : la section « active » est celle qu'on lit.
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    for (const item of available) {
      const node = document.querySelector(item.href);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [reservationEnabled]);

  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Navigation rapide"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/92 backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {items.map((item) => {
          const isActive = active === item.href;
          return (
            <li key={item.href} className="flex-1">
              <a
                href={item.href}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 transition-colors duration-300',
                  isActive ? 'text-lime' : 'text-fg-subtle',
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-300',
                    isActive && 'scale-110',
                  )}
                  aria-hidden="true"
                />
                <span className="text-[0.625rem] font-medium leading-none">
                  {item.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
