# Smart Campus Room Availability Checker – Assignment #04

Author: Zhanaliuly Ayat · AI assistant used: Claude (Anthropic); baseline prototype generated with Bolt.new.

## Folder layout

| Folder | Content |
| --- | --- |
| `initial/` | Original Assignment #03 / Practice #06 prototype (Bolt.new export), unchanged code + `tests/regression-ac.test.ts` |
| `final/` | Extended and refactored version (room catalog, capacity/equipment filters, layered modules) |
| `final/tests/` | 53 automated tests (AC1–AC5 regression, F1–F5, integration, time/data, Practice 11 explanation feature) |
| `evidence/` | Real outputs of every test/demo command used in the report |

## Requirements

- Node.js **22.18 or newer** (runs `.ts` test files directly with the built-in test runner; on 22.6–22.17 add `--experimental-strip-types`)
- npm

## Setup and run (final version)

```bash
cd final
npm install        # installs React, Vite, Tailwind, lucide-react
npm run dev        # starts the app, open the URL Vite prints (usually http://localhost:5173)
npm run build      # production build
```

## Tests

```bash
cd final
npm test                 # all 53 tests, summary output
npm run test:verbose     # same tests, one line per test
npm run demo             # prints the Task 2 demonstration scenarios

cd ../initial
npm test                 # the same 10 AC regression tests on the ORIGINAL code
                         # expected: 9 pass, 1 fail (AC1 defect: start exactly at "now" was accepted)
```

Run the regression file against any version:

```bash
cd final
AVAIL_MODULE=../initial/src/lib/availability.ts node --test tests/regression-ac.test.ts   # original: 9/10
AVAIL_MODULE=src/domain/availability.ts         node --test tests/regression-ac.test.ts   # final: 10/10
```

## Final structure (`final/src`)

| Layer | Files |
| --- | --- |
| UI | `App.tsx`, `components/StepHeader`, `RoomFilters`, `RoomSelector`, `TimeRangeInput`, `ResultPanel`, `Timeline`, `BookingList` |
| State | `domain/checkerState.ts` (reducer) |
| Domain | `domain/availability.ts`, `filters.ts`, `time.ts`, `bookings.ts`, `types.ts` |
| Explanation (Practice 11) | `explain/contract.ts`, `prompt.ts`, `adapters.ts` (mock only), `service.ts`; UI `components/ExplanationPanel.tsx` |
| Data | `data/campusData.ts` (6 fictional rooms, 7 bookings, simulated now = 09:00) |

No login, payments, live APIs or database. All data is fictional.

## Practice 11 – Explain availability

After **Check Availability**, press **Explain availability** for a short AI-style explanation. It uses a clearly labelled **mock** model (no API key, no network); the booking rules still decide. The *Explanation source (demo)* list simulates a timeout, an API error, a missing key and a model that invents details, to show the rule-based fallback. See `AGENTS.md` for the rules AI agents must follow.
