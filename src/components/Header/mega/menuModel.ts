// Turns the /mega-menu API response into the shape the header renders (design reference: design-mockups/header).
// Desktop panels and the mobile drawer both read this one model.

export type MetalSwatch = 'yellow' | 'white' | 'rose' | 'platinum';

export interface MenuLink {
  label: string;
  href: string;
  /** Small icon from the CMS (shape outlines, style icons). */
  icon?: string;
  /** Metal links (`?metal=yg` …) render a metal swatch instead of the CMS icon. */
  swatch?: MetalSwatch;
}

export interface MenuGroup {
  title: string;
  href?: string;
  links: MenuLink[];
  /** Long lists (shapes, styles) sit in two columns. */
  twoColumn: boolean;
  /** A "View all" entry from the CMS, shown as an underlined link under the group. */
  viewAll?: MenuLink;
}

export interface MenuTile {
  image: string;
  href: string;
  title: string;
}

export interface MenuEntry {
  id: string;
  label: string;
  href?: string;
  columns: MenuGroup[][];
  tiles: MenuTile[];
}

const COLUMN_KEYS = ['menu_column_one', 'menu_column_two', 'menu_column_three', 'menu_column_four'];
const METAL_CODES: Record<string, MetalSwatch> = { yg: 'yellow', wg: 'white', rg: 'rose', wp: 'white', pt: 'platinum', pl: 'platinum' };

// The CMS stores absolute links to the old domain (https://ashclair.com/rings…). Links on these hosts become
// site-relative so they work on any environment; anything else is treated as external and left alone.
const INTERNAL_HOSTS = ['ashclair.com', 'www.ashclair.com', 'pendyora.com', 'www.pendyora.com'];

export function toSitePath(url?: string | null): string {
  if (!url) {
    return '';
  }
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    const base = process.env.NEXT_PUBLIC_BASE_URL ? new URL(process.env.NEXT_PUBLIC_BASE_URL).host : '';
    if (INTERNAL_HOSTS.includes(parsed.host) || parsed.host === base) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
    }
  } catch {
    // Not a valid URL — fall through and keep it as is.
  }
  return trimmed;
}

/** "EARRINGS" → "Earrings", "shop by metal" → "Shop by metal"; mixed-case labels are kept. */
export function tidyLabel(label?: string | null): string {
  const text = (label ?? '').trim().replace(/\s+/g, ' ');
  if (text && (text === text.toUpperCase() || text === text.toLowerCase())) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  return text;
}

function metalSwatch(href: string): MetalSwatch | undefined {
  const match = href.match(/[?&]metal=([a-z]+)/i);
  return match ? METAL_CODES[match[1].toLowerCase()] : undefined;
}

function toLink(label: string | undefined | null, href: string | undefined | null, icon?: string | null): MenuLink | null {
  const path = toSitePath(href);
  const text = tidyLabel(label);
  if (!text || !path) {
    return null;
  }
  const swatch = metalSwatch(path);
  return { label: text, href: path, swatch, icon: swatch ? undefined : (icon ?? undefined) };
}

const isViewAll = (title?: string) => /^(view|shop) all\b/i.test((title ?? '').trim());

/** `masterData` is the master list from the store (shapes, styles, …), used to name and picture `master` entries. */
export function buildMenu(apiMenu: any[] | null | undefined, masterData: any[] | null | undefined): MenuEntry[] {
  if (!Array.isArray(apiMenu)) {
    return [];
  }
  const masterById = new Map<string, any>((masterData ?? []).map((m: any) => [m?.id, m]));

  return apiMenu
    .filter((item) => item?.is_web_visible && item?.is_active !== false)
    .sort((a, b) => (a?.sequence ?? 0) - (b?.sequence ?? 0))
    .map((item) => {
      const columns = COLUMN_KEYS.map((key) => {
        const groups: MenuGroup[] = [];
        (item?.[key] ?? []).forEach((raw: any) => {
          const links = (
            raw?.is_master
              ? (raw?.master ?? []).map((m: any) => {
                  const master = masterById.get(m?.id);
                  return toLink(master?.name, m?.value, master?.image?.[0]);
                })
              : (raw?.sub_menu ?? []).map((s: any) => toLink(s?.title, s?.link, s?.image))
          ).filter(Boolean) as MenuLink[];

          // A bare "View all" entry belongs to the group above it.
          if (links.length === 0 && isViewAll(raw?.title) && groups.length > 0) {
            const viewAll = toLink(raw?.title, raw?.link);
            if (viewAll) {
              groups[groups.length - 1].viewAll = viewAll;
            }
            return;
          }
          const title = tidyLabel(raw?.title);
          if (!title && links.length === 0) {
            return;
          }
          groups.push({
            title,
            href: toSitePath(raw?.link) || undefined,
            links,
            twoColumn: Boolean(raw?.is_multiple_column) || links.length > 6,
          });
        });
        return groups;
      }).filter((groups) => groups.length > 0);

      const tiles: MenuTile[] = (item?.menu_images ?? [])
        .map((img: any) => ({ image: img?.image, href: toSitePath(img?.link), title: (img?.title ?? '').trim() }))
        .filter((tile: MenuTile) => tile.image && tile.href);

      return {
        id: String(item?.id),
        label: tidyLabel(item?.main_menu_title),
        href: toSitePath(item?.main_menu_title_link) || undefined,
        columns,
        tiles,
      };
    });
}
