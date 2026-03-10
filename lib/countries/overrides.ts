const aliasOverrides = new Map<string, string[]>();

export const setAliasesForCountry = (countryId: string, aliases: string[]) => {
  const clean = Array.from(
    new Set(
      aliases
        .map((alias) => alias.trim())
        .filter((alias) => alias.length > 0)
    )
  );

  aliasOverrides.set(countryId, clean);
  return clean;
};

export const getAliasesForCountry = (countryId: string): string[] => aliasOverrides.get(countryId) || [];

export const getAllAliasOverrides = (): Record<string, string[]> =>
  Object.fromEntries(Array.from(aliasOverrides.entries()));
