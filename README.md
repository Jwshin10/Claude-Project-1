# Planvoice

A Notion-style planner for plans, groups and to-dos — with voice input on the way.

Everything is stored **only on your device** (in the browser's IndexedDB). There is no account and no server.

## What works today (phase 1)

- **Plans → groups → items.** Group items into categories such as "Flights" or "Things to do".
- **List and Board views** with drag-and-drop to reorder items or move them between groups (long-press on a phone).
- **Item details:** status, priority, due date, tags, checklist and notes.
- **Hide done** per plan, plan icons and descriptions, group colours and reordering.
- **Backup:** export and restore a JSON file from *Settings & backup*.
- **Installable** as an app on your phone or desktop, and works offline.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

To try it on your phone, run `npm run dev -- --host` and open the Network URL on a phone on the same Wi‑Fi.
To install it as an app, it must be served over HTTPS (any static host works — the app uses hash URLs, so no server config is needed).

```bash
npm test         # unit tests (data layer, date helpers)
npm run lint
npm run build    # production build in dist/
```

## Project layout

```
src/
  db/          types, Dexie database, all mutations (actions.ts), backup
  components/  list/board views, drag-and-drop hook, item dialog, shared UI
  pages/       plan page, home, settings
  lib/         ids, dates, small helpers
```

Every change to data goes through `src/db/actions.ts`, so voice commands can reuse the same operations as the UI.

## Roadmap

1. ~~Core app: plans, groups, items, list + board views, local storage~~
2. Voice input: speech-to-text, a local command parser, preview-before-saving, one-step undo
3. Optional Claude parsing for free-form commands (bring your own API key)
4. Calendar view, search, command palette, templates
