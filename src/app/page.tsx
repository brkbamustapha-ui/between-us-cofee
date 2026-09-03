import { getSiteContent } from '@/lib/db';
import { menuJsonLd, restaurantJsonLd } from '@/lib/seo';

import { About } from '@/components/site/about';
import { BestSellers } from '@/components/site/best-sellers';
import { BottomNav } from '@/components/site/bottom-nav';
import { Contact } from '@/components/site/contact';
import { Footer } from '@/components/site/footer';
import { Gallery } from '@/components/site/gallery';
import { Header, type NavLink } from '@/components/site/header';
import { Hero } from '@/components/site/hero';
import { Location } from '@/components/site/location';
import { MenuSection } from '@/components/site/menu-section';
import { Reservation } from '@/components/site/reservation';
import { Socials } from '@/components/site/socials';
import { StorySections } from '@/components/site/story-sections';
import { Videos } from '@/components/site/videos';

/**
 * Page d'accueil.
 *
 * Rendu côté serveur à partir du contenu en base : chaque section est
 * administrable, et une section vide (aucune photo, aucune vidéo, réservation
 * désactivée) se retire d'elle-même plutôt que d'afficher un cadre vide.
 */
export default async function HomePage() {
  const content = await getSiteContent();
  const {
    settings,
    hero,
    about,
    contact,
    reservation,
    footer,
    sections,
    categories,
    items,
    gallery,
    videos,
    socials,
  } = content;

  // La navigation ne liste que les sections réellement présentes sur la page.
  const enabledSections = sections.filter((section) => section.enabled);
  const hasMenu = categories.some((category) => category.enabled);

  const links: NavLink[] = [
    { label: 'Accueil', href: '#accueil' },
    { label: 'À propos', href: '#a-propos' },
    ...enabledSections
      .filter((section) => ['coffee', 'brunch'].includes(section.key))
      .map((section) => ({
        label: section.eyebrow || section.title,
        href: `#${section.key}`,
      })),
    ...(hasMenu ? [{ label: 'Menu', href: '#menu' }] : []),
    ...(gallery.some((photo) => photo.enabled)
      ? [{ label: 'Galerie', href: '#galerie' }]
      : []),
    ...(videos.some((video) => video.enabled)
      ? [{ label: 'Vidéos', href: '#videos' }]
      : []),
    { label: 'Nous trouver', href: '#localisation' },
    { label: 'Contact', href: '#contact' },
  ];

  const menuSchema = menuJsonLd(content);

  return (
    <>
      {/* Données structurées : lues par Google, invisibles pour le visiteur. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(restaurantJsonLd(content)),
        }}
      />
      {menuSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }}
        />
      )}

      {settings.announcementEnabled && settings.announcement && (
        <div className="fixed inset-x-0 top-0 z-[55] bg-lime px-4 py-2 text-center text-[0.8125rem] font-medium text-on-lime">
          {settings.announcement}
        </div>
      )}

      <Header
        settings={settings}
        contact={contact}
        links={links}
        reservationEnabled={reservation.enabled}
      />

      <main id="contenu">
        <Hero hero={hero} settings={settings} />
        <About about={about} />
        <StorySections sections={sections} />
        <MenuSection categories={categories} items={items} />
        <BestSellers items={items} />
        <Gallery photos={gallery} />
        <Videos videos={videos} />
        <Reservation settings={reservation} />
        <Location contact={contact} />
        <Contact contact={contact} socials={socials} />
        <Socials socials={socials} />
      </main>

      <Footer
        settings={settings}
        footer={footer}
        contact={contact}
        socials={socials}
        links={links}
      />

      <BottomNav reservationEnabled={reservation.enabled} />
    </>
  );
}
