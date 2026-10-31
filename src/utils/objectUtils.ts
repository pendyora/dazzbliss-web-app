interface JewelryObject {
  jewelry_types: Array<{ id: string; name: string }>;
  metal_color_id: string[];
  diamond_color_id: string[];
  diamond_details: any[];
  shape_id: Array<string | null>;
  price_range: { max_price?: number; min_price?: number };
  carats: number[] | string[];
  subTypes: Array<{ id: string; name: string }>;
  currency_symbol: string;
  special_title: Array<{ id: string; title: string }>;
}

// Function to check if an object is empty
export function isObjectEmpty(obj: JewelryObject | null | undefined): boolean {
  // Check if obj is null or undefined
  if (!obj) {
    return true;
  }

  // Check each property of the object
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key as keyof JewelryObject];

      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length > 0) {
          return false; // Non-empty array
        }
      }
      // Handle objects (like price_range)
      else if (typeof value === 'object' && value !== null) {
        if (Object.keys(value).length > 0) {
          return false; // Non-empty object
        }
      }
      // Handle strings (like currency_symbol)
      else if (typeof value === 'string' && value !== '') {
        return false; // Non-empty string
      }
    }
  }

  // All properties are empty
  return true;
}
