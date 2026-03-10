const REGION_LABELS: Record<string, string> = {
  Africa: 'Africa',
  Antarctica: 'Antarctica',
  Asia: 'Asia',
  Europe: 'Europe',
  'North America': 'North America',
  Oceania: 'Oceania',
  'South America': 'South America',
  All: 'All Regions'
};

const collapseSpaces = (value: string): string => value.replace(/\s+/g, ' ').trim();

const stripControlChars = (value: string): string => value.replace(/[\u0000-\u001F\u007F]/g, '');

export const formatRegionLabel = (value: string): string => {
  const clean = collapseSpaces(stripControlChars(value));
  if (!clean) {
    return 'Unknown Region';
  }

  return REGION_LABELS[clean] || clean;
};

export const formatCountryName = (value: string): string => {
  const normalized = collapseSpaces(stripControlChars(value).normalize('NFKC'));
  return normalized || 'Unknown';
};