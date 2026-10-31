/**
 * The `subTypes` query param carries subtype master codes, and those codes were typed by hand in
 * admin with no fixed format: `THREE_STONE`, `HIDDEN HALO`, `Channel-Set`, `Side_Stone`,
 * `Wedding & Anniversary`. Encoding only `_` -> `-` left spaces in place, so URLSearchParams wrote
 * them as `+` (`hidden+halo` next to `three-stone`), and decoding `-` -> `_` could never match a
 * code with a real hyphen.
 *
 * Codes are now compared in one normalised form: lowercase, `&` read as `and`, and any run of
 * spaces, underscores or hyphens collapsed to a single `-`. Old `+` links still resolve.
 */
export const normalizeSubTypeCode = (value?: string | null) =>
  (value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** URL token for a subtype master code, e.g. `HIDDEN HALO` -> `hidden-halo`. */
export const subTypeCodeToParam = (code?: string | null) => normalizeSubTypeCode(code);

/**
 * Subtypes a `subTypes` URL token refers to, as `{ id }` rows.
 *
 * Tried in order:
 * 1. a code match among the current page's own subtypes — the same code can exist under more than
 *    one jewelry type (Engagement Rings and Custom Engagement Rings both have `THREE_STONE`);
 * 2. a name match among the current page's subtypes — hand-written mega menu links often use the
 *    display name (`earrings?subTypes=solitaire` for code `SOLITAIRE_EARRING`, `Tennis` for `TN`,
 *    `studs` for `Stud`);
 * 3. a code match on any subtype master (a child of a jewelry type), for a subtype the page's list
 *    does not include. Other masters are skipped — an occasion coded `WEDDING` is not a subtype.
 */
export const findSubTypesByParam = (token: string, masterData: any[] = [], pageSubTypes: any[] = []) => {
  const normalized = normalizeSubTypeCode(token);
  if (!normalized) {
    return [];
  }
  const jewelryTypeIds = new Set(masterData?.filter((item: any) => item?.parent_code === 'JEWELRY_TYPE').map((item: any) => item?.id));
  const codeMatches = masterData?.filter((item: any) => jewelryTypeIds.has(item?.parent_id) && normalizeSubTypeCode(item?.code) === normalized) ?? [];
  const pageIds = new Set(pageSubTypes?.map((item: any) => item?.id));

  const codeOnPage = codeMatches.filter((item: any) => pageIds.has(item?.id));
  if (codeOnPage.length > 0) {
    return codeOnPage;
  }
  const singular = normalized.replace(/s$/, '');
  const nameOnPage =
    pageSubTypes?.filter((item: any) => {
      const name = normalizeSubTypeCode(item?.name);
      return name === normalized || name === singular;
    }) ?? [];
  if (nameOnPage.length > 0) {
    return nameOnPage;
  }
  return codeMatches;
};
