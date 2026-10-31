/**
 * The brand's Instagram account, shared by the live feed and the static fallback gallery.
 * Env-driven so the account can change without a code edit.
 *
 * DAZZBLISS TODO: set NEXT_PUBLIC_INSTAGRAM_PROFILE_URL and NEXT_PUBLIC_INSTAGRAM_HANDLE (e.g. `@yourhandle`).
 * While they are empty the handle and the Follow button are hidden.
 */
export const INSTAGRAM_PROFILE_URL = process.env.NEXT_PUBLIC_INSTAGRAM_PROFILE_URL || '';
export const INSTAGRAM_HANDLE = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || '';

export const COMMUNITY_SUBHEADING = `Upload your photo with your new jewels on Instagram${
  INSTAGRAM_HANDLE ? ` and tag us at ${INSTAGRAM_HANDLE}` : ''
} for a chance to be featured in our gallery!`;
