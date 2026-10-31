import React from 'react';

// Campaign content for the poster half of each auth screen (design reference: design-mockups/auth/index.html).
// Marketing copy lives here so it can be swapped per campaign (or moved to the CMS) without touching the screens.
// Wrap the accent word of a title in <em> — it is set in italic gilt.

export interface PosterLink {
  label: string;
  href: string;
}

export interface PosterSlide {
  image: string;
  alt: string;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  cta: PosterLink;
}

export interface PosterOffer {
  eyebrow: string;
  value: string;
  unit: string;
  caption: string;
  body: string;
  perks: string[];
}

/** Collapsed version of the poster shown above the form at ≤1024px. `slim` keeps it to one line. */
export interface PosterBanner {
  image: string;
  eyebrow?: string;
  title: React.ReactNode;
  cta: PosterLink;
  slim?: boolean;
}

export type Poster =
  | { kind: 'image'; tag: string; slides: PosterSlide[]; banner: PosterBanner }
  | { kind: 'offer'; tag: string; image: string; alt: string; offer: PosterOffer; banner: PosterBanner }
  | { kind: 'still'; image: string; alt: string; eyebrow: string; title: React.ReactNode; body: string; cta: PosterLink; banner: PosterBanner };

const goldenHour: PosterSlide = {
  image: '/images/auth/promo-neck.jpg',
  alt: 'Model wearing layered fine gold necklaces in warm light',
  eyebrow: 'New collection',
  title: (
    <>
      The Golden
      <br />
      <em>Hour</em> edit
    </>
  ),
  body: 'Fine chains and quiet charms in 14k gold, made to be layered and never taken off.',
  cta: { label: 'Shop the edit', href: '/collections' },
};

const goldenHourBanner: PosterBanner = {
  image: '/images/auth/promo-neck.jpg',
  eyebrow: 'New · The Golden Hour edit',
  title: (
    <>
      Light, <em>layered</em>, worn every day.
    </>
  ),
  cta: { label: 'Shop the edit', href: '/collections' },
};

const giftGuide = {
  image: '/images/auth/p-teardrop.jpg',
  alt: 'Gold teardrop hoop earrings with pavé diamonds',
  title: (
    <>
      Gifts that are <em>kept</em>
    </>
  ),
  body: 'Hand-picked pieces under $500, wrapped in our signature box at no cost.',
  cta: { label: 'Explore gifts', href: '/giftguide' },
  banner: { image: '/images/auth/p-teardrop.jpg', title: 'The Gift Guide is here', cta: { label: 'Explore', href: '/giftguide' }, slim: true },
};

export const AUTH_POSTERS = {
  signIn: {
    kind: 'image',
    tag: 'Pendyora · Autumn 2026',
    slides: [
      goldenHour,
      {
        image: '/images/auth/m-hands-hold.jpg',
        alt: 'Couple holding hands, showing a diamond engagement ring',
        eyebrow: 'Bridal',
        title: (
          <>
            Say yes,
            <br />
            <em>beautifully</em>
          </>
        ),
        body: 'Book a private appointment with our diamond specialists, in store or by video.',
        cta: { label: 'Book an appointment', href: '/virtual-appointment' },
      },
      {
        image: '/images/auth/promo-chain.jpg',
        alt: 'Stacked gold collar necklaces on a black background',
        eyebrow: 'Members only',
        title: (
          <>
            The Private
            <br />
            <em>Preview</em>
          </>
        ),
        body: 'Members shop each new collection before everyone else.',
        cta: { label: 'Become a member', href: '/createanaccount' },
      },
    ],
    banner: goldenHourBanner,
  },
  register: {
    kind: 'offer',
    tag: 'Pendyora · Welcome',
    image: '/images/auth/m-hand-satin.jpg',
    alt: 'Hand wearing fine gold rings against champagne silk',
    offer: {
      eyebrow: 'Welcome to the house',
      value: '10',
      unit: '%',
      caption: 'off your first piece',
      body: "Join today and we'll email your welcome code. Valid for 30 days on full-price jewelry.",
      perks: ['Free gift wrapping', 'Birthday surprise', 'Early access to launches', 'Free lifetime cleaning'],
    },
    banner: {
      image: '/images/auth/m-hand-satin.jpg',
      eyebrow: 'Welcome offer',
      title: (
        <>
          <em>10% off</em> your first piece
        </>
      ),
      cta: { label: 'Code sent when you join', href: '/createanaccount' },
    },
  },
  welcome: {
    kind: 'image',
    tag: 'Pendyora · Members',
    slides: [
      {
        image: '/images/auth/promo-chain.jpg',
        alt: 'Stacked gold collar necklaces on a black background',
        eyebrow: "You're on the list",
        title: (
          <>
            The Private
            <br />
            <em>Preview</em>
          </>
        ),
        body: "As a member you'll shop each new collection before it launches. We'll email you the night before.",
        cta: { label: 'Browse the collections', href: '/collections' },
      },
    ],
    banner: {
      image: '/images/auth/promo-chain.jpg',
      eyebrow: 'Members only',
      title: (
        <>
          The Private <em>Preview</em>
        </>
      ),
      cta: { label: 'Browse the collections', href: '/collections' },
    },
  },
  forgot: { kind: 'still', eyebrow: 'The Gift Guide', ...giftGuide },
  sent: { kind: 'still', eyebrow: 'While you wait', ...giftGuide },
  reset: {
    kind: 'image',
    tag: 'Pendyora · Care',
    slides: [
      {
        image: '/images/auth/m-hand-sepia.jpg',
        alt: 'Hand resting on a shoulder wearing a diamond ring in soft sepia light',
        eyebrow: "Members' care",
        title: (
          <>
            Made to <em>last</em>
            <br />a lifetime
          </>
        ),
        body: 'Every piece comes with free cleaning, polishing and a stone check, for as long as you own it.',
        cta: { label: 'About our care service', href: '/jewelry-care' },
      },
    ],
    banner: {
      image: '/images/auth/m-hand-sepia.jpg',
      title: 'Free lifetime cleaning for members',
      cta: { label: 'Details', href: '/jewelry-care' },
      slim: true,
    },
  },
  updated: {
    kind: 'image',
    tag: 'Pendyora · Autumn 2026',
    slides: [{ ...goldenHour, eyebrow: 'Pick up where you left off' }],
    banner: goldenHourBanner,
  },
  expired: {
    kind: 'image',
    tag: 'Pendyora · Appointments',
    slides: [
      {
        image: '/images/auth/m-bw-hand.jpg',
        alt: 'Black and white photo of a hand wearing a diamond halo ring',
        eyebrow: 'In store or by video',
        title: (
          <>
            A private
            <br />
            <em>appointment</em>
          </>
        ),
        body: 'Try pieces with a specialist, get sized, or design something of your own. Always free.',
        cta: { label: 'Book a time', href: '/virtual-appointment' },
      },
    ],
    banner: {
      image: '/images/auth/m-bw-hand.jpg',
      title: 'Book a private appointment',
      cta: { label: 'Book', href: '/virtual-appointment' },
      slim: true,
    },
  },
} satisfies Record<string, Poster>;
