import Fuse from 'fuse.js';

import type { Country, CountryOrder, GameMode, GameSession, GuessResult, SurvivalAttempt } from '@/lib/types';

const NORMALIZATION_REGEX = /\p{Diacritic}/gu;

const SURVIVAL_MINUTES_BY_CONTINENT: Record<string, number> = {
  Europe: 10,
  Asia: 12,
  'South America': 6,
  Africa: 10,
  'North America': 11,
  Oceania: 7,
  Antarctica: 5
};

export const normalizeGuess = (value: string): string =>
  value
    .trim()
    .normalize('NFD')
    .replace(NORMALIZATION_REGEX, '')
    .replace(/[^\p{L}\p{N}\s'-]/gu, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();

const buildFuse = (countries: Country[]): Fuse<Country> =>
  new Fuse(countries, {
    keys: ['name', 'nativeName', 'aliases'],
    threshold: 0.32,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 2
  });

export const getSuggestions = (
  value: string,
  countries: Country[],
  limit = 5
): Array<{ id: string; name: string }> => {
  const cleaned = normalizeGuess(value);
  if (!cleaned || cleaned.length < 2) {
    return [];
  }

  const fuse = buildFuse(countries);

  return fuse
    .search(cleaned, { limit })
    .map((entry) => ({ id: entry.item.id, name: entry.item.name }));
};

export const findMatchingCountry = (value: string, countries: Country[]): Country | undefined => {
  const cleaned = normalizeGuess(value);
  if (!cleaned) {
    return undefined;
  }

  const exactMatches = countries.filter((country) =>
    country.aliases.some((alias) => normalizeGuess(alias) === cleaned)
  );

  if (exactMatches.length === 1) {
    return exactMatches[0];
  }

  if (exactMatches.length > 1) {
    // Resolve ambiguous aliases (e.g. Guyana/French Guiana) by prioritizing
    // canonical names over translated alias collisions.
    const canonicalNameMatch = exactMatches.find((country) => normalizeGuess(country.name) === cleaned);
    if (canonicalNameMatch) {
      return canonicalNameMatch;
    }

    const independentMatch = exactMatches.find((country) => country.unMember || !country.territory);
    if (independentMatch) {
      return independentMatch;
    }

    return exactMatches[0];
  }

  const best = buildFuse(countries).search(cleaned, { limit: 1 })[0];

  if (!best || typeof best.score !== 'number' || best.score > 0.35) {
    return undefined;
  }

  return best.item;
};

const createSessionId = (): string =>
  `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const shuffle = <T>(items: T[]): T[] => {
  const copy = items.slice();

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
};

const sortNorthToSouth = (countries: Country[]): Country[] =>
  countries.slice().sort((left, right) => {
    const latDiff = right.centroid[0] - left.centroid[0];
    if (Math.abs(latDiff) > 0.15) {
      return latDiff;
    }

    const lngDiff = left.centroid[1] - right.centroid[1];
    if (Math.abs(lngDiff) > 0.15) {
      return lngDiff;
    }

    return left.name.localeCompare(right.name);
  });

export const getSurvivalTimeLimit = (region: string): number => {
  const minutes = SURVIVAL_MINUTES_BY_CONTINENT[region] ?? 10;
  return minutes * 60;
};

export const getPoolForMode = (
  countries: Country[],
  mode: GameMode,
  region: string,
  includeTerritories = true
): Country[] => {
  const filtered = countries.filter((country) => (includeTerritories ? true : !country.territory));

  if (mode === 'marathon') {
    if (region && region !== 'All') {
      return filtered.filter((country) => country.continent === region);
    }

    return filtered;
  }

  if (region && region !== 'All') {
    return filtered.filter((country) => country.continent === region);
  }

  return filtered;
};

export const createGameSession = (params: {
  mode: GameMode;
  region: string;
  countries: Country[];
  order: CountryOrder;
}): GameSession => {
  const orderedCountries =
    params.order === 'random' ? shuffle(params.countries) : sortNorthToSouth(params.countries);

  return {
    id: createSessionId(),
    mode: params.mode,
    region: params.region,
    score: 0,
    streak: 0,
    completed: [],
    remaining: orderedCountries.map((country) => country.id),
    skipped: [],
    missed: [],
    wrongGuesses: [],
    survivalAttempts: [],
    timestamp: new Date().toISOString(),
    elapsedSeconds: 0,
    order: params.order,
    timeLimitSeconds: params.mode === 'survival' ? getSurvivalTimeLimit(params.region) : undefined
  };
};

export const scoreForCorrectGuess = (currentStreak: number): number => 10 + Math.min(10, currentStreak * 2);

export const getCurrentTargetId = (session: GameSession | null): string | null => {
  if (!session || session.remaining.length === 0) {
    return null;
  }

  return session.remaining[0];
};

export const markCorrectGuess = (session: GameSession, countryId: string): GameSession => {
  if (!session.remaining.includes(countryId) || session.completed.includes(countryId)) {
    return session;
  }

  const streak = session.streak + 1;

  return {
    ...session,
    score: session.score + scoreForCorrectGuess(streak),
    streak,
    completed: [...session.completed, countryId],
    remaining: session.remaining.filter((id) => id !== countryId)
  };
};

export const markSurvivalCorrect = (session: GameSession, countryId: string): GameSession => {
  const next = markCorrectGuess(session, countryId);

  const attempt: SurvivalAttempt = {
    targetId: countryId,
    guessId: countryId,
    correct: true
  };

  return {
    ...next,
    survivalAttempts: [...next.survivalAttempts, attempt]
  };
};

export const markSurvivalMiss = (
  session: GameSession,
  targetId: string,
  guessedCountryId?: string
): GameSession => {
  if (!session.remaining.includes(targetId)) {
    return session;
  }

  const attempt: SurvivalAttempt = {
    targetId,
    guessId: guessedCountryId,
    correct: false
  };

  return {
    ...session,
    streak: 0,
    missed: Array.from(new Set([...session.missed, targetId])),
    wrongGuesses: guessedCountryId
      ? Array.from(new Set([...session.wrongGuesses, guessedCountryId]))
      : session.wrongGuesses,
    survivalAttempts: [...session.survivalAttempts, attempt],
    remaining: session.remaining.filter((id) => id !== targetId)
  };
};

export const exhaustRemainingAsMissed = (session: GameSession): GameSession => {
  if (session.remaining.length === 0) {
    return session;
  }

  const newAttempts: SurvivalAttempt[] = session.remaining.map((targetId) => ({
    targetId,
    correct: false
  }));

  return {
    ...session,
    streak: 0,
    missed: Array.from(new Set([...session.missed, ...session.remaining])),
    survivalAttempts: [...session.survivalAttempts, ...newAttempts],
    remaining: []
  };
};

export const skipOrRevealCountry = (
  session: GameSession,
  countryId: string,
  status: GuessResult['status']
): GameSession => {
  if (!session.remaining.includes(countryId)) {
    return session;
  }

  return {
    ...session,
    streak: 0,
    skipped: status === 'reveal' ? [...session.skipped, countryId] : session.skipped,
    remaining: session.remaining.filter((id) => id !== countryId)
  };
};

export const markIncorrectGuess = (session: GameSession): GameSession => ({
  ...session,
  streak: 0
});

export const incrementElapsed = (session: GameSession): GameSession => ({
  ...session,
  elapsedSeconds: session.elapsedSeconds + 1
});

export const completionPercent = (session: GameSession): number => {
  const total = session.completed.length + session.remaining.length + session.missed.length;

  if (total === 0) {
    return 0;
  }

  const attempted = total - session.remaining.length;
  return Math.round((attempted / total) * 100);
};

export const evaluateGuess = (
  input: string,
  targetCountry: Country | undefined,
  countries: Country[]
): GuessResult => {
  if (!targetCountry) {
    return {
      status: 'incorrect',
      message: 'No target country is currently active.'
    };
  }

  const matched = findMatchingCountry(input, countries);
  if (!matched) {
    return {
      status: 'incorrect',
      message: 'No close match found. Try another spelling.'
    };
  }

  if (matched.id !== targetCountry.id) {
    return {
      status: 'incorrect',
      message: 'Incorrect guess.',
      expectedCountryId: targetCountry.id,
      matchedCountryId: matched.id
    };
  }

  return {
    status: 'correct',
    message: `Correct: ${targetCountry.name}!`,
    expectedCountryId: targetCountry.id,
    matchedCountryId: matched.id
  };
};
