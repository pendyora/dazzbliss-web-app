import { apiAddAddress, apiGetCities, apiGetCountries, apiGetStates } from '@/services/addressService';

/**
 * Saving an address a wallet collected (PayPal Express, Shop Pay) as one of our Address rows.
 * Wallets hand back free-text state/city and an ISO country code, while our rows hold
 * Countries/States/Cities foreign keys — this maps one onto the other.
 */

export const norm = (s?: string) =>
  String(s ?? '')
    .trim()
    .toLowerCase();

// Wallets return US states as 2-letter codes (e.g. "CA"), while the DB stores full names
// ("California"). Map codes → names so state/city resolve correctly for US addresses.
const US_STATE_CODE_TO_NAME: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  PR: 'Puerto Rico',
};

// Resolve a state row from the wallet's state (name or code) against the DB state list.
const resolveState = (stateRows: any[], province?: string, countryIso2?: string) => {
  const raw = String(province ?? '').trim();
  if (!raw || !stateRows?.length) {
    return null;
  }
  const target = norm(raw);
  // 1. Exact name match.
  let st = stateRows.find((s) => norm(s?.name) === target);
  if (st) {
    return st;
  }
  // 2. US 2-letter code → full name.
  if (String(countryIso2 ?? '').toUpperCase() === 'US' && raw.length === 2) {
    const full = US_STATE_CODE_TO_NAME[raw.toUpperCase()];
    if (full) {
      st = stateRows.find((s) => norm(s?.name) === norm(full));
      if (st) {
        return st;
      }
    }
  }
  // 3. Fuzzy contains match (handles "St." vs "Saint", trailing region words, etc.).
  st = stateRows.find((s) => {
    const n = norm(s?.name);
    return n === target || n.startsWith(target) || target.startsWith(n) || n.includes(target) || target.includes(n);
  });
  return st || null;
};

// Resolve a city row from the wallet's city against the DB city list for that state.
const resolveCity = (cityRows: any[], city?: string) => {
  const target = norm(city);
  if (!target || !cityRows?.length) {
    return null;
  }
  let ci = cityRows.find((c) => norm(c?.name) === target);
  if (ci) {
    return ci;
  }
  ci = cityRows.find((c) => {
    const n = norm(c?.name);
    return n.startsWith(target) || target.startsWith(n) || n.includes(target) || target.includes(n);
  });
  return ci || null;
};

/** A wallet address in wallet-neutral terms. */
export type WalletAddress = {
  firstName?: string | null;
  lastName?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  /** State/province name or code. */
  province?: string | null;
  postalCode?: string | null;
  /** ISO 3166-1 alpha-2, e.g. "US". */
  countryCode?: string | null;
  phone?: string | null;
  email?: string | null;
};

/**
 * Best-effort map of a wallet address onto an Address payload (without `type`).
 * Throws when there is no street address to save.
 */
export async function buildWalletAddressPayload(addr: WalletAddress) {
  if (!String(addr?.address1 ?? '').trim()) {
    throw new Error('No delivery address was provided. Please add a shipping address and try again.');
  }

  const countriesRes: any = await apiGetCountries();
  const countries: any[] = countriesRes?.data?.data?.rows || [];
  const country =
    countries.find((c) => norm(c?.iso2) === norm(addr.countryCode ?? '')) || countries.find((c) => norm(c?.name) === norm(addr.countryCode ?? ''));

  let stateId: any = null;
  let cityId: any = null;
  let stateMatched = false;
  let cityMatched = false;

  if (country) {
    const statesRes: any = await apiGetStates(country.id);
    const stateRows: any[] = statesRes?.data?.data?.rows || [];
    const st = resolveState(stateRows, addr.province ?? '', country?.iso2);
    if (st) {
      stateId = st.id;
      stateMatched = true;
      const citiesRes: any = await apiGetCities(st.id);
      const cityRows: any[] = citiesRes?.data?.data?.rows || [];
      const ci = resolveCity(cityRows, addr.city ?? '');
      if (ci) {
        cityId = ci.id;
        cityMatched = true;
      }
    }
  }

  // An unmatched city goes into the dedicated free-text column. State has no such column, so
  // unmatched state text still falls back into address2 to keep the invoice/label complete.
  // City is required server-side, and some wallets/locales omit it — fall back to the state text
  // so the address still saves rather than failing after the buyer already approved.
  const cityText = !cityMatched ? String(addr.city || addr.province || '').trim() || null : null;
  const line2Parts = [addr.address2, !stateMatched ? addr.province : null].filter(Boolean);

  // Stored as "+<country code> <number>". A wallet that already sends E.164 ("+14155550100")
  // has its country code stripped first so it is not doubled.
  const rawPhone = String(addr.phone || '').trim();
  let phoneDigits = rawPhone.replace(/\D/g, '');
  const phoneCode = country?.phone_code ? String(country.phone_code).replace(/\D/g, '') : '';
  if (rawPhone.startsWith('+') && phoneCode && phoneDigits.startsWith(phoneCode)) {
    phoneDigits = phoneDigits.slice(phoneCode.length);
  }

  return {
    first_name: addr.firstName || '',
    last_name: addr.lastName || '',
    mobile: phoneDigits ? (phoneCode ? `+${phoneCode} ${phoneDigits}` : phoneDigits) : '',
    email: addr.email || '',
    address1: String(addr.address1).trim(),
    address2: line2Parts.join(', '),
    city_id: cityId,
    city_text: cityText,
    state_id: stateId,
    country_id: country?.id ?? null,
    postal_code: addr.postalCode || '',
  };
}

const samePostal = (a?: string, b?: string) => norm(a).replace(/\s/g, '') === norm(b).replace(/\s/g, '');

/** A saved address that is the same place and recipient as `payload`, if any. */
export function findMatchingAddress(payload: any, candidates: any[]) {
  return (
    (candidates || []).find(
      (c) =>
        c?.id &&
        String(c?.country_id ?? '') === String(payload?.country_id ?? '') &&
        String(c?.state_id ?? '') === String(payload?.state_id ?? '') &&
        norm(c?.address1) === norm(payload?.address1) &&
        norm(c?.address2) === norm(payload?.address2) &&
        samePostal(c?.postal_code, payload?.postal_code) &&
        norm(c?.first_name) === norm(payload?.first_name) &&
        norm(c?.last_name) === norm(payload?.last_name),
    ) || null
  );
}

/** Create an Address row (1 = delivery, 2 = billing) and return its id. */
export async function createAddress(payload: any, type: 1 | 2) {
  const res: any = await apiAddAddress({ ...payload, type });
  const id = res?.data?.data?.id ?? res?.data?.data?.data?.id;
  if (!id) {
    throw new Error('Could not save the address. Please try again.');
  }
  return id;
}

/**
 * Save a wallet address as an Address row of `type` (1 = delivery, 2 = billing) and return its id.
 * Reuses a matching saved address from `candidates` instead of creating a duplicate.
 */
export async function saveWalletAddress(addr: WalletAddress, type: 1 | 2, candidates: any[] = []) {
  const payload = await buildWalletAddressPayload(addr);
  const existing = findMatchingAddress(
    payload,
    candidates.filter((c) => !c?.type || Number(c.type) === type),
  );
  if (existing) {
    return existing.id;
  }
  return createAddress(payload, type);
}
