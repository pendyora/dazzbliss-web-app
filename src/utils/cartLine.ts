/**
 * Cart lines carry their engraving as `engraving_text` (the API key since the Nest port). Guest
 * carts saved in localStorage (`cartItems`) before that used `engravingText`, so lines read back
 * from storage go through here before they are used or sent to the API.
 */
export const normalizeCartLine = <T = any>(line: T): T => {
  if (!line || typeof line !== 'object' || !('engravingText' in (line as any))) {
    return line;
  }
  const { engravingText, ...rest } = line as any;
  return { ...rest, engraving_text: (line as any).engraving_text ?? engravingText } as T;
};

export const normalizeCartLines = <T = any>(lines: T): T => (Array.isArray(lines) ? (lines.map(normalizeCartLine) as T) : lines);
