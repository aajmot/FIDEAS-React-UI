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

// Function to convert a number to words
export const numberToWords = (num: number | string | null | undefined): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  // 1. Safety Check
  if (num === null || num === undefined || num === '') return 'Zero';
  
  // 2. Truncate to 2 decimal places without rounding
  // We convert to string and use regex to "cut off" anything after 2 decimals
  const numStr = num.toString();
  const match = numStr.match(/^-?\d+(?:\.\d{0,2})?/);
  const truncatedStr = match ? match[0] : '0';
  
  const [mainStr, decimalStr] = truncatedStr.includes('.') 
    ? truncatedStr.split('.') 
    : [truncatedStr, ''];

  const mainPart = Math.abs(parseInt(mainStr));
  const decimalValue = decimalStr ? parseInt(decimalStr.padEnd(2, '0')) : 0;

  const convertBase = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertBase(n % 100) : '');
    if (n < 1000000) return convertBase(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertBase(n % 1000) : '');
    return n.toString();
  };

  let result = mainPart === 0 ? 'Zero' : convertBase(mainPart);

  // 3. Handle Decimal Part (e.g., .59)
  if (decimalValue > 0) {
    result += ' Point ';
    
    // Check for leading zero in the decimal string (e.g., "05")
    if (decimalStr && decimalStr.length === 2 && decimalStr.startsWith('0')) {
      result += 'Zero ' + ones[parseInt(decimalStr[1])];
    } else if (decimalStr && decimalStr.length === 1) {
      // Handles .5 as "Fifty" (5 becomes 50 via padEnd)
      result += convertBase(decimalValue);
    } else {
      result += convertBase(decimalValue);
    }
  }

  return result.trim();
};
