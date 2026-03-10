import { NextRequest } from 'next/server';

import { isRateLimited } from '@/lib/api/rate-limit';
import { fail, ok } from '@/lib/api/response';
import { getContinents, getCountries, getCountryStats } from '@/lib/countries/catalog';
import { getAliasesForCountry } from '@/lib/countries/overrides';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
};

export const OPTIONS = async () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const GET = async (request: NextRequest) => {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    const limiter = isRateLimited(`countries:${ip}`, 120, 60_000);

    if (limiter.limited) {
      return fail(429, 'RATE_LIMITED', 'Too many requests. Please retry shortly.');
    }

    const { searchParams } = new URL(request.url);
    const continent = searchParams.get('continent') || undefined;
    const includeTerritories = searchParams.get('includeTerritories') !== 'false';

    const countries = getCountries({ continent, includeTerritories }).map((country) => {
      const overrides = getAliasesForCountry(country.id);

      return {
        ...country,
        aliases: Array.from(new Set([...country.aliases, ...overrides]))
      };
    });
    const continents = getContinents();
    const stats = getCountryStats();

    return ok(
      {
        countries,
        continents,
        stats,
        generatedAt: new Date().toISOString()
      },
      {
        headers: {
          ...CORS_HEADERS,
          'X-RateLimit-Remaining': String(limiter.remaining),
          'X-RateLimit-Reset': String(limiter.resetAt)
        }
      }
    );
  } catch (error) {
    return fail(500, 'COUNTRIES_FETCH_FAILED', 'Failed to load countries.', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
