type MaskGroup = {
  size: number;
  separator: string; // separator AFTER this group (empty for the last group)
};

type MobileRule = {
  regex: RegExp;
  maxLength: number;
  message: string;
  mask: MaskGroup[];
};

const mobileRulesByCode: Record<string, MobileRule> = {
  // USA / Canada: 202-555-0143
  '1': {
    regex: /^[2-9]\d{9}$/,
    maxLength: 12, // 10 digits + 2 dashes
    message: 'Please enter a valid 10-digit US/Canada number',
    mask: [
      { size: 3, separator: '-' },
      { size: 3, separator: '-' },
      { size: 4, separator: '' },
    ],
  },
  // India: 9876543210 (no separator)
  '91': {
    regex: /^[6-9]\d{9}$/,
    maxLength: 10,
    message: 'Please enter a valid 10-digit Indian number starting with 6-9',
    mask: [{ size: 10, separator: '' }],
  },
  // Belgium: 470 12 34 56
  '32': {
    regex: /^\d{9,10}$/,
    maxLength: 13, // 10 digits + 3 spaces
    message: 'Please enter a valid 9-10 digit Belgium number',
    mask: [
      { size: 3, separator: ' ' },
      { size: 2, separator: ' ' },
      { size: 2, separator: ' ' },
      { size: 2, separator: '' },
    ],
  },
  // Spain: 612 34 56 78
  '34': {
    regex: /^[6-9]\d{8}$/,
    maxLength: 12, // 9 digits + 3 spaces
    message: 'Please enter a valid 9-digit Spain number',
    mask: [
      { size: 3, separator: ' ' },
      { size: 2, separator: ' ' },
      { size: 2, separator: ' ' },
      { size: 2, separator: '' },
    ],
  },
  // United Kingdom: 7400 123456
  '44': {
    regex: /^\d{10,11}$/,
    maxLength: 12, // 11 digits + 1 space
    message: 'Please enter a valid 10-11 digit UK number',
    mask: [
      { size: 4, separator: ' ' },
      { size: 6, separator: '' },
    ],
  },
  // Australia: 412 345 678
  '61': {
    regex: /^\d{9}$/,
    maxLength: 11, // 9 digits + 2 spaces
    message: 'Please enter a valid 9-digit Australia number',
    mask: [
      { size: 3, separator: ' ' },
      { size: 3, separator: ' ' },
      { size: 3, separator: '' },
    ],
  },
};

const defaultRule: MobileRule = {
  regex: /^\d{7,15}$/,
  maxLength: 15,
  message: 'Please enter a valid mobile number',
  mask: [],
};

export const getMobileRule = (countryCode: string | undefined): MobileRule => {
  if (!countryCode) {
    return defaultRule;
  }
  const code = String(countryCode).replace(/\D/g, '');
  return mobileRulesByCode[code] || defaultRule;
};

/**
 * Format digits into masked display based on country mask.
 * e.g. US: "2025550143" → "202-555-0143"
 *      AU: "412345678"  → "412 345 678"
 *      IN: "9876543210" → "9876543210"
 */
export const formatMobile = (value: string, mask: MaskGroup[]): string => {
  const digits = value.replace(/\D/g, '');
  if (!mask.length) {
    return digits;
  }
  let result = '';
  let idx = 0;
  for (let i = 0; i < mask.length; i++) {
    if (idx >= digits.length) {
      break;
    }
    const group = mask[i];
    const chunk = digits.slice(idx, idx + group.size);
    result += chunk;
    idx += group.size;
    // Add separator only if there are more digits coming
    if (group.separator && idx < digits.length) {
      result += group.separator;
    }
  }
  return result;
};

/** Strip mask characters (dashes, spaces) to get raw digits */
export const unmaskMobile = (value: string): string => value.replace(/\D/g, '');
