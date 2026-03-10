import { NextRequest } from 'next/server';

import { fail, ok } from '@/lib/api/response';
import { getAllAliasOverrides, setAliasesForCountry } from '@/lib/countries/overrides';

export const GET = async () => ok({ overrides: getAllAliasOverrides() });

export const POST = async (request: NextRequest) => {
  try {
    const body = (await request.json()) as { countryId?: string; aliases?: string[] };
    if (!body.countryId || !Array.isArray(body.aliases)) {
      return fail(400, 'INVALID_PAYLOAD', 'Provide countryId and aliases array.');
    }

    const aliases = setAliasesForCountry(body.countryId, body.aliases.slice(0, 80));
    return ok({ countryId: body.countryId, aliases }, { status: 201 });
  } catch (error) {
    return fail(500, 'ALIASES_SAVE_FAILED', 'Unable to save aliases.', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
