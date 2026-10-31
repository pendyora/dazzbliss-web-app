// Header content the API doesn't provide yet (see docs/header-mega-menu-api-changes.md). Edit here until it does.

export interface HeaderServiceLink {
  icon: 'video' | 'book' | 'care' | 'chat';
  label: string;
  href: string;
}

/** Service strip at the foot of every mega-menu panel. */
export const SERVICE_STRIP: { label: string; links: HeaderServiceLink[] } = {
  label: 'Need help choosing?',
  links: [
    { icon: 'video', label: 'Book a virtual appointment', href: '/virtual-appointment' },
    { icon: 'book', label: 'Diamond education', href: '/education' },
    { icon: 'care', label: 'Jewelry care', href: '/jewelry-care' },
  ],
};

/** Links on the right of the announcement bar (desktop). */
export const ANNOUNCEMENT_LINKS: HeaderServiceLink[] = [
  { icon: 'video', label: 'Book an appointment', href: '/virtual-appointment' },
  { icon: 'chat', label: 'Client care', href: '/contactpage' },
];

/** Chips shown in the search panel before anything is typed. Each runs a normal search. */
export const POPULAR_SEARCHES = ['Engagement rings', 'Tennis bracelet', 'Diamond studs', 'Gold hoops', 'Lab-grown', 'Wedding bands'];
