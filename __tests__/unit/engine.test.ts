import {
  createGameSession,
  evaluateGuess,
  exhaustRemainingAsMissed,
  findMatchingCountry,
  getPoolForMode,
  getSurvivalTimeLimit,
  markCorrectGuess,
  markSurvivalMiss,
  normalizeGuess,
  scoreForCorrectGuess
} from '@/lib/game/engine';
import type { Country } from '@/lib/types';

const makeCountry = (
  id: string,
  name: string,
  continent: string,
  territory = false,
  centroid: [number, number] = [0, 0]
): Country => ({
  id,
  name,
  nativeName: name,
  continent,
  subregion: 'Test',
  coordinates: {
    type: 'Feature',
    properties: { id, name },
    geometry: { type: 'Point', coordinates: [centroid[1], centroid[0]] }
  },
  territory,
  unMember: !territory,
  aliases: [name],
  centroid
});

const countries: Country[] = [
  makeCountry('FRA', 'France', 'Europe', false, [46, 2]),
  makeCountry('DEU', 'Germany', 'Europe', false, [51, 10]),
  makeCountry('ATF', 'French Southern Territories', 'Antarctica', true, [-49, 70])
];

describe('game engine', () => {
  it('normalizes accents and punctuation in guesses', () => {
    expect(normalizeGuess('Cote d\'Ivoire')).toBe("cote d'ivoire");
    expect(normalizeGuess('C\u00f4te d\u2019Ivoire')).toBe('cote divoire');
  });

  it('filters pool by mode, region, and territory setting', () => {
    const marathon = getPoolForMode(countries, 'marathon', 'All', true);
    expect(marathon).toHaveLength(3);

    const europe = getPoolForMode(countries, 'continent', 'Europe', true);
    expect(europe.map((item) => item.id)).toEqual(['FRA', 'DEU']);

    const withoutTerritories = getPoolForMode(countries, 'marathon', 'All', false);
    expect(withoutTerritories.map((item) => item.id)).toEqual(['FRA', 'DEU']);
  });

  it('creates sequential sessions in north-to-south order', () => {
    const session = createGameSession({
      mode: 'continent',
      region: 'Europe',
      countries: countries.slice(0, 2),
      order: 'sequential'
    });

    expect(session.remaining).toEqual(['DEU', 'FRA']);
  });

  it('creates and updates a session on correct answer', () => {
    const session = createGameSession({
      mode: 'continent',
      region: 'Europe',
      countries: countries.slice(0, 2),
      order: 'random'
    });

    const target = session.remaining[0];
    const updated = markCorrectGuess(session, target);

    expect(updated.completed).toContain(target);
    expect(updated.remaining).not.toContain(target);
    expect(updated.streak).toBe(1);
    expect(updated.score).toBe(scoreForCorrectGuess(1));
  });

  it('marks survival misses and can exhaust remaining targets', () => {
    const session = createGameSession({
      mode: 'survival',
      region: 'Europe',
      countries: countries.slice(0, 2),
      order: 'sequential'
    });

    const missed = markSurvivalMiss(session, session.remaining[0], 'FRA');
    expect(missed.missed).toHaveLength(1);
    expect(missed.wrongGuesses).toContain('FRA');
    expect(missed.remaining).toHaveLength(1);

    const exhausted = exhaustRemainingAsMissed(missed);
    expect(exhausted.remaining).toHaveLength(0);
    expect(exhausted.missed).toHaveLength(2);
  });

  it('provides continent-based survival timer values', () => {
    expect(getSurvivalTimeLimit('Europe')).toBe(600);
    expect(getSurvivalTimeLimit('Asia')).toBe(720);
    expect(getSurvivalTimeLimit('South America')).toBe(360);
  });

  it('evaluates guesses against the current target country', () => {
    const result = evaluateGuess('france', countries[0], countries);
    expect(result.status).toBe('correct');

    const wrong = evaluateGuess('germany', countries[0], countries);
    expect(wrong.status).toBe('incorrect');
  });

  it('prefers canonical country names when aliases are ambiguous', () => {
    const frenchGuiana = makeCountry('GUF', 'French Guiana', 'South America', true, [4, -53]);
    frenchGuiana.aliases = ['French Guiana', 'Guyana'];

    const guyana = makeCountry('GUY', 'Guyana', 'South America', false, [5, -58]);
    guyana.aliases = ['Guyana'];

    const matched = findMatchingCountry('Guyana', [frenchGuiana, guyana]);
    expect(matched?.id).toBe('GUY');
  });
});
