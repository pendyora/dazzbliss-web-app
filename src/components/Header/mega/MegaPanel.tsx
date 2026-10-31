'use client';

import React from 'react';

import Link from 'next/link';
import { LuArrowRight, LuBookOpen, LuMessageSquare, LuSparkles, LuVideo } from 'react-icons/lu';

import { SERVICE_STRIP } from './headerContent';

import type { HeaderServiceLink } from './headerContent';
import type { MenuEntry, MenuGroup, MenuLink, MetalSwatch } from './menuModel';

// Full class strings so Tailwind's JIT can see them.
const SWATCH: Record<MetalSwatch, string> = {
  yellow: 'bg-gradient-to-br from-metal-yellow-light via-metal-yellow-mid to-metal-yellow-deep',
  white: 'bg-gradient-to-br from-metal-white-light via-metal-white-mid to-metal-white-deep',
  rose: 'bg-gradient-to-br from-metal-rose-light via-metal-rose-mid to-metal-rose-deep',
  platinum: 'bg-gradient-to-br from-metal-platinum-light via-metal-platinum-mid to-metal-platinum-deep',
};

const SERVICE_ICONS: Record<HeaderServiceLink['icon'], typeof LuVideo> = {
  video: LuVideo,
  book: LuBookOpen,
  care: LuSparkles,
  chat: LuMessageSquare,
};

export function ServiceIcon({ icon, className = 'h-4 w-4' }: { icon: HeaderServiceLink['icon']; className?: string }) {
  const Icon = SERVICE_ICONS[icon];
  return <Icon className={className} strokeWidth={1.2} aria-hidden />;
}

function LinkMark({ link }: { link: MenuLink }) {
  if (link.swatch) {
    return <i className={`h-3.5 w-3.5 flex-none rounded-full shadow-[inset_0_0_0_1px] shadow-ink/10 ${SWATCH[link.swatch]}`} aria-hidden />;
  }
  if (link.icon) {
    return <img src={link.icon} alt="" loading="lazy" className="h-[22px] w-[22px] flex-none object-contain mix-blend-multiply" />;
  }
  return null;
}

/** One titled list of links. Shared by the desktop panel and the mobile drawer. */
export function MenuGroupBlock({ group, onNavigate }: { group: MenuGroup; onNavigate?: () => void }) {
  const titleClass = 'm-0 mb-4 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-ink';
  return (
    <div className="mt-7 first:mt-0">
      {group.title &&
        (group.href ? (
          <Link href={group.href} onClick={onNavigate} className={`${titleClass} block hover:text-gilt`}>
            {group.title}
          </Link>
        ) : (
          <h3 className={titleClass}>{group.title}</h3>
        ))}
      {group.links.length > 0 && (
        <ul className={`m-0 grid list-none gap-[11px] p-0 ${group.twoColumn ? 'grid-cols-2 gap-x-[26px]' : ''}`}>
          {group.links.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link
                href={link.href}
                onClick={onNavigate}
                className="inline-flex items-center gap-2.5 text-[14px] text-ink-soft transition-colors hover:text-ink"
              >
                <LinkMark link={link} />
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {group.viewAll && (
        <Link
          href={group.viewAll.href}
          onClick={onNavigate}
          className="mt-3.5 inline-block border-b border-ink pb-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink"
        >
          {group.viewAll.label}
        </Link>
      )}
    </div>
  );
}

export function ServiceStrip({ entry, onNavigate }: { entry?: MenuEntry; onNavigate?: () => void }) {
  return (
    <div className="border-t border-line bg-stone/55">
      <div className="mx-auto flex h-[54px] max-w-[1440px] items-center gap-8 overflow-x-auto px-[clamp(16px,3.2vw,56px)] [scrollbar-width:none]">
        <span className="whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-[0.2em]">{SERVICE_STRIP.label}</span>
        {SERVICE_STRIP.links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] text-ink-soft hover:text-ink"
          >
            <ServiceIcon icon={link.icon} className="h-4 w-4 text-gilt" />
            {link.label}
          </Link>
        ))}
        {entry?.href && (
          <Link
            href={entry.href}
            onClick={onNavigate}
            className="ml-auto inline-flex items-center gap-2 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.14em] text-ink hover:text-gilt"
          >
            Shop all {entry.label}
            <LuArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Desktop panel for one menu entry: link columns, editorial tiles from the CMS, and the service strip. */
export default function MegaPanel({ entry, onNavigate }: { entry: MenuEntry; onNavigate: () => void }) {
  return (
    <div className="animate-rise">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] gap-[clamp(28px,4vw,64px)] px-[clamp(16px,3.2vw,56px)] pb-10 pt-9">
        <div className="grid auto-cols-[minmax(150px,1fr)] grid-flow-col content-start gap-[clamp(20px,2.6vw,44px)]">
          {entry.columns.map((groups, i) => (
            <div key={i} className="min-w-0">
              {groups.map((group, g) => (
                <MenuGroupBlock key={`${group.title}-${g}`} group={group} onNavigate={onNavigate} />
              ))}
            </div>
          ))}
        </div>
        {entry.tiles.length > 0 && (
          <div className="grid auto-cols-[clamp(200px,18vw,280px)] grid-flow-col gap-3.5 xls:auto-cols-[clamp(170px,16vw,220px)]">
            {entry.tiles.slice(0, 2).map((tile, i) => (
              <Link key={tile.href + i} href={tile.href} onClick={onNavigate} className={`group/tile block ${i > 0 ? 'xls:hidden' : ''}`}>
                <span className="block overflow-hidden bg-stone">
                  <img
                    src={tile.image}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] ease-luxe group-hover/tile:scale-[1.04]"
                  />
                </span>
                <span className="flex items-baseline justify-between gap-2.5 pt-3">
                  <b className="font-cormorant text-[19px] font-medium leading-tight">{tile.title || entry.label}</b>
                  <span className="whitespace-nowrap text-[10.5px] uppercase tracking-[0.16em] text-ink-soft group-hover/tile:text-ink">
                    Shop now →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <ServiceStrip entry={entry} onNavigate={onNavigate} />
    </div>
  );
}
