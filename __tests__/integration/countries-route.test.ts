/** @jest-environment node */

import { NextRequest } from 'next/server';

import { GET } from '@/app/api/countries/route';

jest.mock('@/lib/countries/catalog', () => ({
  getCountries: () => [
    {
      id: 'FRA',
      name: 'France',
      nativeName: 'France',
      continent: 'Europe',
      subregion: 'Western Europe',
      coordinates: {
        type: 'Feature',
        properties: { id: 'FRA', name: 'France' },
        geometry: { type: 'Point', coordinates: [2.2, 48.8] }
      },
      territory: false,
      unMember: true,
      aliases: ['France'],
      centroid: [48.8, 2.2]
    }
  ],
  getContinents: () => ['Europe'],
  getCountryStats: () => ({ total: 1, unMembers: 1, territories: 0 })
}));

jest.mock('@/lib/countries/overrides', () => ({
  getAliasesForCountry: () => ['French Republic']
}));

describe('GET /api/countries', () => {
  it('returns countries and metadata payload', async () => {
    const request = new NextRequest('http://localhost:3000/api/countries?continent=Europe');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.countries).toHaveLength(1);
    expect(body.data.countries[0].aliases).toContain('French Republic');
    expect(body.data.stats.total).toBe(1);
  });
});
