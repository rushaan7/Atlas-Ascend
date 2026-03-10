'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { Country } from '@/lib/types';

interface CountriesPayload {
  countries: Country[];
}

interface AliasPayload {
  overrides: Record<string, string[]>;
}

export default function AdminPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string[]>>({});
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      const countriesResponse = await fetch('/api/countries?includeTerritories=true');
      const countriesBody = (await countriesResponse.json()) as { ok: boolean; data: CountriesPayload };
      if (countriesBody.ok) {
        setCountries(countriesBody.data.countries);
      }

      const aliasesResponse = await fetch('/api/admin/aliases');
      const aliasesBody = (await aliasesResponse.json()) as { ok: boolean; data: AliasPayload };
      if (aliasesBody.ok) {
        setOverrides(aliasesBody.data.overrides);
      }
    };

    void load();
  }, []);

  const visibleCountries = useMemo(() => {
    const cleaned = query.trim().toLowerCase();
    if (!cleaned) {
      return countries.slice(0, 80);
    }

    return countries.filter((country) => country.name.toLowerCase().includes(cleaned)).slice(0, 80);
  }, [countries, query]);

  const selected = countries.find((country) => country.id === selectedId);
  const selectedAliases = selectedId ? overrides[selectedId] || [] : [];

  const saveAliases = async () => {
    if (!selectedId) {
      return;
    }

    const aliases = Array.from(
      new Set(
        aliasInput
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
      )
    );

    const response = await fetch('/api/admin/aliases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ countryId: selectedId, aliases })
    });

    const payload = (await response.json()) as {
      ok: boolean;
      data?: { countryId: string; aliases: string[] };
      error?: { message: string };
    };

    if (!payload.ok || !payload.data) {
      setStatus(payload.error?.message || 'Save failed.');
      return;
    }

    setOverrides((current) => ({
      ...current,
      [payload.data!.countryId]: payload.data!.aliases
    }));
    setStatus(`Saved ${payload.data.aliases.length} aliases for ${selected?.name || payload.data.countryId}.`);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="surface-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-ink">Admin Dashboard</h1>
          <Link className="rounded-xl border border-ink/15 px-3 py-1.5 text-sm text-ink" href="/">
            Back to Game
          </Link>
        </div>

        <p className="mt-2 text-sm text-muted">
          Manage custom aliases and spelling variants for countries/territories. Changes apply immediately via API.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-ink/10 bg-background p-4">
            <label className="field-label">
              Search country
              <input
                className="field-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type country name"
              />
            </label>

            <ul className="mt-3 max-h-96 space-y-2 overflow-auto pr-1">
              {visibleCountries.map((country) => (
                <li key={country.id}>
                  <button
                    type="button"
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                      selectedId === country.id
                        ? 'border-accent/40 bg-accent/10 text-accent'
                        : 'border-ink/10 bg-surface text-ink'
                    }`}
                    onClick={() => {
                      setSelectedId(country.id);
                      setAliasInput((overrides[country.id] || []).join(', '));
                      setStatus('');
                    }}
                  >
                    <span className="font-semibold">{country.name}</span>
                    <span className="ml-2 text-xs text-muted">{country.continent}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-background p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Country Overrides</h2>

            {selected ? (
              <>
                <p className="mt-3 text-sm text-ink">
                  Editing: <span className="font-semibold">{selected.name}</span>
                </p>
                <label className="field-label mt-3">
                  Aliases (comma-separated)
                  <textarea
                    className="field-input min-h-28"
                    value={aliasInput}
                    onChange={(event) => setAliasInput(event.target.value)}
                    placeholder="Example: USA, United States of America"
                  />
                </label>
                <button className="btn-primary mt-3" type="button" onClick={() => void saveAliases()}>
                  Save aliases
                </button>

                <div className="mt-4 rounded-xl border border-ink/10 bg-surface p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Current custom aliases</p>
                  {selectedAliases.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">None configured yet.</p>
                  ) : (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {selectedAliases.map((alias) => (
                        <li key={alias} className="rounded-full border border-ink/15 px-2.5 py-1 text-xs text-ink">
                          {alias}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Select a country to edit aliases.</p>
            )}

            {status && <p className="mt-3 text-sm text-accent">{status}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
