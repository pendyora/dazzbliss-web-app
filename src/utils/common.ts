export const formatCurrency = (amount: any) => {
  if (typeof window === 'undefined') {
    return amount; // Return the raw amount if we're server-side (SSR)
  }
  // Get the currency code from localStorage, trim extra spaces, and provide a default value if invalid
  let currencyCode = (localStorage.getItem('currency') || 'USD').trim();

  // Validate the currency code format (must be a 3-letter ISO code)
  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    currencyCode = 'USD'; // Fallback to "USD" if validation fails
  }

  // Format the amount using Intl.NumberFormat
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });

  // Get the formatted value
  let formattedAmount = formatter.format(amount);

  // Add a space after the currency symbol if not already present
  if (!formattedAmount.includes(' ')) {
    const symbol = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode,
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value;

    if (symbol) {
      formattedAmount = formattedAmount.replace(symbol, `${symbol} `);
    }
  }

  return formattedAmount.replace(' ', '');
};

/**
 * Finds the master row whose `name` exactly equals the typed search text.
 *
 * AntD `Select` only commits a value when an option is clicked or Enter is pressed, so a fully
 * typed country/state/city stays unselected. Feed this from `onSearch` to commit the value as
 * soon as the text matches an option outright. Comparison is trimmed and case-insensitive.
 */
export function findExactOptionByName(rows: any[] | undefined | null, searchText: string): any | null {
  const typed = String(searchText ?? '')
    .trim()
    .toLowerCase();
  if (!typed) {
    return null;
  }
  return (
    rows?.find(
      (row) =>
        String(row?.name ?? '')
          .trim()
          .toLowerCase() === typed,
    ) ?? null
  );
}

/** Comma-separated line for checkout/profile summaries; omits city when missing. */
export function formatAddressDisplayLine(parts: {
  address1?: string | null;
  cityName?: string | null;
  stateName?: string | null;
  countryName?: string | null;
  postalCode?: string | null;
}): string {
  const segments = [parts.address1?.trim(), parts.cityName?.trim(), parts.stateName?.trim(), parts.countryName?.trim()].filter((s): s is string =>
    Boolean(s && s.length > 0),
  );
  const body = segments.join(', ');
  const pc = parts.postalCode != null ? String(parts.postalCode).trim() : '';
  if (!body && !pc) {
    return '';
  }
  if (!pc) {
    return body;
  }
  if (!body) {
    return pc;
  }
  return `${body} - ${pc}`;
}
