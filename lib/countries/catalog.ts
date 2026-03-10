import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import countryMetadata from 'world-countries';
import countriesTopology from 'world-atlas/countries-50m.json';
import { feature } from 'topojson-client';

import type { Country, CountryFilters } from '@/lib/types';

interface CountryMeta {
  cca3: string;
  ccn3?: string;
  independent?: boolean;
  unMember: boolean;
  region: string;
  subregion: string;
  latlng: [number, number];
  name: {
    common: string;
    official: string;
    nativeName?: Record<string, { official: string; common: string }>;
  };
  translations: Record<string, { official: string; common: string }>;
  altSpellings: string[];
}

type CountriesTopology = Topology<{ countries: GeometryCollection }>;

const CONTINENT_SORT = [
  'Africa',
  'Antarctica',
  'Asia',
  'Europe',
  'North America',
  'Oceania',
  'South America'
] as const;

const normalizeContinent = (region: string, subregion: string): string => {
  if (region === 'Americas') {
    return subregion.includes('South') ? 'South America' : 'North America';
  }

  if (region === 'Polar' || region === 'Antarctic') {
    return 'Antarctica';
  }

  if (region === 'Oceania' || region === 'Asia' || region === 'Europe' || region === 'Africa') {
    return region;
  }

  return 'Oceania';
};

const removeEmpty = (value: string): boolean => value.trim().length > 0;

const normalizeId = (id: string | number | undefined): string | undefined => {
  if (id === undefined || id === null) {
    return undefined;
  }

  const normalized = String(id).trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.padStart(3, '0');
};

const buildAliasList = (country: CountryMeta): string[] => {
  const nativeNames = country.name.nativeName
    ? Object.values(country.name.nativeName).flatMap((entry) => [entry.common, entry.official])
    : [];

  const translatedNames = Object.values(country.translations || {}).flatMap((entry) => [
    entry.common,
    entry.official
  ]);

  return Array.from(
    new Set(
      [
        country.name.common,
        country.name.official,
        ...country.altSpellings,
        ...nativeNames,
        ...translatedNames
      ].filter(Boolean)
    )
  ).filter(removeEmpty);
};

const topology = countriesTopology as unknown as CountriesTopology;
const converted = feature(topology, topology.objects.countries) as unknown;
const maybeCollection = converted as {
  type?: string;
  features?: Array<Feature<Geometry>>;
};

const featureCollection: FeatureCollection<Geometry> =
  maybeCollection.type === 'FeatureCollection' && Array.isArray(maybeCollection.features)
    ? {
        type: 'FeatureCollection',
        features: maybeCollection.features
      }
    : {
        type: 'FeatureCollection',
        features: []
      };

const geometryByCcn3 = new Map<string, Geometry>();
for (const countryFeature of featureCollection.features) {
  const n3 = normalizeId(countryFeature.id as string | number | undefined);
  if (n3 && countryFeature.geometry) {
    geometryByCcn3.set(n3, countryFeature.geometry);
  }
}

const rawCountries = countryMetadata as CountryMeta[];

const countriesCache: Country[] = rawCountries
  .map((country) => {
    const ccn3 = normalizeId(country.ccn3);
    const geometry = ccn3 ? geometryByCcn3.get(ccn3) : undefined;
    const [lat = 0, lng = 0] = country.latlng || [0, 0];
    const centroid: [number, number] = [lat, lng];
    const nativeNameSource = country.name.nativeName
      ? Object.values(country.name.nativeName)[0]
      : undefined;

    const coordinates: Feature<Geometry> = geometry
      ? {
          type: 'Feature',
          properties: {
            id: country.cca3,
            name: country.name.common
          },
          geometry
        }
      : {
          type: 'Feature',
          properties: {
            id: country.cca3,
            name: country.name.common
          },
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        };

    return {
      id: country.cca3,
      name: country.name.common,
      nativeName: nativeNameSource?.common || country.name.common,
      continent: normalizeContinent(country.region, country.subregion),
      subregion: country.subregion || 'Unspecified',
      coordinates,
      territory: !country.independent,
      unMember: country.unMember,
      aliases: buildAliasList(country),
      centroid
    } satisfies Country;
  })
  .sort((left, right) => left.name.localeCompare(right.name));

export const getCountries = (filters?: CountryFilters): Country[] => {
  const includeTerritories = filters?.includeTerritories ?? true;
  const continent = filters?.continent;

  return countriesCache.filter((country) => {
    if (!includeTerritories && country.territory) {
      return false;
    }

    if (continent && continent !== 'All' && country.continent !== continent) {
      return false;
    }

    return true;
  });
};

export const getCountryById = (id: string): Country | undefined =>
  countriesCache.find((country) => country.id === id);

export const getContinents = (): string[] => CONTINENT_SORT.slice();

export const getSubregions = (continent: string): string[] =>
  Array.from(
    new Set(
      countriesCache
        .filter((country) => country.continent === continent)
        .map((country) => country.subregion)
        .sort((left, right) => left.localeCompare(right))
    )
  );

export const getCountryStats = () => {
  const unMembers = countriesCache.filter((country) => country.unMember).length;
  const territories = countriesCache.filter((country) => country.territory).length;

  return {
    total: countriesCache.length,
    unMembers,
    territories
  };
};
