# User Guide

## Start a game

1. Choose a mode: `Continent`, `Guess All Marathon`, or `Survival`.
2. Set region and sequence (`Randomized` or `Top to Bottom`).
3. Click `Start Session`.

## Gameplay

- The map zooms to the current target country/territory.
- Type your guess and submit.
- Use suggestions for autocorrect.
- Correct answers increase score and streak.
- Use `Skip` or `Reveal` when blocked (not available in survival).

## Survival mode

- One chance per country.
- Wrong guess marks the current target as missed and moves to the next one.
- At the end, map outcomes are revealed:
  - missed target countries are highlighted red
  - wrong guessed countries are highlighted green
- Time limits:
  - Europe: 10 min
  - Asia: 12 min
  - South America: 6 min
  - Africa: 10 min
  - North America: 11 min
  - Oceania: 7 min
  - Antarctica: 5 min

## Keyboard shortcuts

- `Ctrl/Cmd + K`: focus guess input
- `S`: skip country
- `R`: reveal country
- `G`: restart session
- `A`: open stats panel
- `O`: open settings panel
- `T`: toggle timer (disabled in survival)

## Panels

- **Stats**: progress, completion, recent sessions
- **Settings**: timer, high contrast, sound, reset marathon progress

## Admin dashboard

Open `/admin` to:

- search countries
- add custom aliases
- update content behavior without code changes

## Offline support

The app uses a service worker in production for basic offline support and cached static assets. In development, service workers are automatically unregistered to avoid stale hot-reload/chunk issues.
