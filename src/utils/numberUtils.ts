// Utility function to round numbers to 2 decimal places
export const roundTo2Decimals = (value: number): number => {
  return parseFloat((Math.round(value * 100) / 100).toFixed(2));
};

// Round all amount fields in an object to 2 decimal places
export const roundAmountFields = <T extends Record<string, any>>(obj: T): T => {
  const rounded: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'number' && (
      key.includes('amount') || 
      key.includes('price') || 
      key.includes('total') ||
      key.includes('taxable') ||
      key.includes('discount') ||
      key.includes('cgst') ||
      key.includes('sgst') ||
      key.includes('igst') ||
      key.includes('cess') ||
      key.includes('tax') ||
      key.includes('subtotal') ||
      key.includes('roundoff') ||
      key.includes('mrp')
    )) {
      rounded[key] = roundTo2Decimals(value);
    } else if (Array.isArray(value)) {
      rounded[key] = value.map(item => 
        typeof item === 'object' && item !== null ? roundAmountFields(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      rounded[key] = roundAmountFields(value);
    } else {
      rounded[key] = value;
    }
  }
  
  return rounded as T;
};
