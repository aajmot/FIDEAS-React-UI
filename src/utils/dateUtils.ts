export const formatUTCToLocal = (utcDate: string): string => {
  if (!utcDate) {
    return "-";
  }
  
  // Handle dates with timezone offset (e.g., 2026-01-10T05:00:48.292758-05:00)
  // or UTC dates (e.g., 2026-01-10T05:00:48.292758Z)
  // or dates without timezone (e.g., 2026-01-10T05:00:48.292758)
  let dateStr = utcDate;
  
  // If the date doesn't have 'Z' or timezone offset, add 'Z' to treat it as UTC
  if (!dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
    dateStr = `${dateStr}Z`;
  }
  
  const date = new Date(dateStr);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return utcDate; // Return original string if parsing failed
  }
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
