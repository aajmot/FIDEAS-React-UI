export const formatUTCToLocal = (utcDate: string): string => {
  const dateStr = utcDate.endsWith('Z') ? utcDate : `${utcDate}Z`;
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
