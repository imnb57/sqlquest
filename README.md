<div align="center">

# SQLQuest

**Learn SQL by playing — from your first `SELECT` to reading execution plans.**

A free, open-source, gamified SQL course that runs a **real PostgreSQL engine inside your browser**.
No signup. No setup. Nothing you write ever leaves your device.

[Getting started](#getting-started) · [How it works](#how-it-works) · [Architecture](#architecture) · [Contributing](#adding-a-lesson)

</div>

---

## What this is

Most SQL tutorials are a wall of text and a copy-paste box. The interactive ones usually
grade you by comparing your query to one blessed answer as a *string*, so a perfectly
correct query written differently is marked wrong.

SQLQuest takes a different approach:

- **PostgreSQL compiled to WebAssembly** runs in a Web Worker in your tab. Real error
  messages, real `EXPLAIN ANALYZE` output, real NULL semantics.
- **Grading executes both queries.** Your submission and the reference solution run
  against identical database state and the *result sets* are compared. Solve it any way
  you like — if the rows match, it's right.
- **Feedback names the actual problem.** Not "incorrect", but *"your query returned 24
  rows and the answer has 16 — a join is probably dropping unmatched records"*.
- **Local-first.** Progress lives in your browser. An account only adds cross-device
  sync and the leaderboard, and you can create one later without losing anything.

| | |
|---|---|
| **6** tracks | Foundations → Joins → Aggregation → Advanced → Data & Modelling → Performance |
| **44** lessons | Each ~6–18 minutes, concepts then practice |
| **237** challenges | Six formats, from writing queries to spotting bugs |
| **6** datasets | Including a 50,000-row table where index choice actually matters |
| **4,680** XP | 60 levels across 7 ranks, 26 achievements, 6 leagues |

---

## Getting started

### Docker (everything, one command)

```bash
cp .env.example .env
# Set a real secret — the stack refuses to start without one:
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env

docker compose up --build
```

→ **http://localhost:3000**

That brings up the app, Postgres, and a one-shot migration job. If port 5432 is already
taken on your machine, set `POSTGRES_PORT=5433` in `.env`.

### Local development

```bash
npm install
cp .env.example .env.local

# Optional — only needed for accounts and the leaderboard:
docker compose -f docker-compose.dev.yml up -d   # Postgres + Adminer on :8080
npm run db:push

npm run dev
```

→ **http://localhost:3000**

The entire course works **without** `DATABASE_URL`. Leave it unset and the app runs in
guest mode: every lesson, the playground, XP, streaks and achievements all function, with
progress in `localStorage`. Only sign-in, sync and the leaderboard need a database.

---

## How it works

### The SQL engine

```
main thread                          Web Worker
───────────                          ──────────
SqlEngine (client.ts)   ──postMessage──▶  PGlite  ──▶  PostgreSQL (WASM)
  · request correlation                    · seed dataset
  · 10s timeout → terminate worker         · run statement
  · grade(submission, solution)            · introspect schema
```

Running Postgres in a worker means a runaway query never freezes the UI — and because
WASM can't be interrupted cooperatively, the main thread simply **terminates and respawns
the worker** on timeout, then re-seeds the dataset transparently.

### How grading works

For a `SELECT` challenge:

1. Run the learner's query → result A
2. Run the reference solution → result B
3. Compare A and B

For an `INSERT`/`UPDATE`/`DELETE`/DDL challenge, the dataset is reset between runs and both
are observed through the challenge's `verifyQuery`, so the statement is graded on its
**effect**, not its text.

Comparison is deliberately forgiving where it should be and strict where it matters:

- `10` = `"10"` = `10.0` (numeric normalisation)
- `0.1 + 0.2` = `0.3` (epsilon snapping — otherwise correct `AVG()` answers fail)
- Row order only matters when the reference solution has an `ORDER BY`
- Duplicates *do* matter (multiset comparison, not set comparison)

Challenges can also declare `mustUse` / `mustNotUse` constraints, so a lesson teaching
`LEFT JOIN` can require one even when a subquery would return the same rows.

### Gamification

XP with a superlinear curve, 60 levels, 7 ranks, day streaks with freezes, hearts that
regenerate on a timer, gems, three rotating daily quests, six leagues and 26 achievements.

All of it is pure, deterministic functions in `src/lib/gamification/` — the same code
evaluates achievements on the client (instant unlock toast) and on the server (durable
record), so they can never disagree. Hearts can be switched off entirely in settings;
nothing is ever paywalled, because there is no paid tier.

---

## Architecture

```
src/
├── app/
│   ├── (marketing)/     Public site — landing, courses, blog, glossary, legal
│   ├── (app)/           Signed-in shell — dashboard, learn map, playground, settings
│   ├── (lesson)/        Full-bleed lesson player (no chrome)
│   ├── (auth)/          Sign in / register
│   ├── api/             Route handlers (progress sync, auth, leaderboard, health)
│   ├── og/              Dynamic Open Graph image generation
│   └── sitemap.ts · robots.ts · manifest.ts · rss.xml/
├── content/
│   ├── datasets.ts      Six seed scripts (deterministic, no random(), no now())
│   ├── tracks/          The curriculum — plain typed objects, one file per track
│   ├── curriculum.ts    Registry: flattening, lookup, unlock gating, search
│   ├── blog.ts          Articles as structured blocks (no MDX toolchain)
│   └── glossary.ts      39 terms, each its own indexable page
├── lib/
│   ├── sql/             Engine client, worker, grader, statement analysis
│   ├── gamification/    Levels, hearts, quests, achievements
│   ├── auth/            Auth.js split into edge-safe and Node-only halves
│   └── seo.ts           Metadata + JSON-LD builders
├── components/          UI primitives, lesson player, charts, marketing
├── stores/              Zustand: progress (local-first) and settings
└── db/                  Drizzle schema and connection
```

**Notable decisions**

- **No MDX.** Lessons and articles are typed TypeScript objects, so a typo is a build
  error rather than a broken page — and `npm run verify:content` can execute every
  reference solution against a real database.
- **Self-hosted webfonts.** Rethink Sans (UI) and JetBrains Mono (code), ~102 KB of
  variable fonts served from our own origin. No CDN, no build-time fetch, and code
  ligatures are forced off so `<>` and `>=` render as the characters learners type.
- **No CDN anything.** A strict CSP blocks every external host. Lottie animations are
  generated by a script in this repo (`npm run gen:lottie`), fonts are vendored, and
  PGlite is served from `public/` rather than bundled (`npm run vendor:pglite`).
- **CodeMirror, not Monaco.** A tenth of the bundle and it actually works on touch.
- **Local-first, server-optional.** Every server dependency degrades to a working
  guest experience rather than an error.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (standalone output) |
| `npm run check` | Typecheck + lint + content verification |
| `npm run verify:content` | **Executes every reference solution against real Postgres** |
| `npm run gen:lottie` | Regenerate the animation JSON from `scripts/generate-lottie.mts` |
| `npm run vendor:pglite` | Copy PGlite's build into `public/pglite/` (runs automatically on dev/build) |
| `npm run db:push` | Push the Drizzle schema to the database |
| `npm run db:generate` | Generate a SQL migration |
| `npm run db:studio` | Drizzle Studio |

`verify:content` is the important one. It checks that every dataset seeds cleanly, every
query challenge's solution runs without error, every solution satisfies its own
`mustUse`/`mustNotUse` rules, every DML challenge has a `verifyQuery`, and that no starter
code accidentally *is* the answer. Run it in CI and a broken lesson can't be merged.

---

## Adding a lesson

Lessons are plain objects. Add one to the relevant file in `src/content/tracks/`:

```ts
{
  id: "f-my-lesson",
  slug: "my-lesson",
  title: "COALESCE and friends",
  subtitle: "Substituting a value for NULL",
  objective: "Replace missing values at query time",
  difficulty: "medium",
  estimatedMinutes: 8,
  datasetId: "realm",
  keywords: ["SQL COALESCE", "handle NULL SQL"],   // used for SEO
  concepts: [
    {
      title: "The first non-NULL wins",
      body: "`COALESCE(a, b, c)` returns the first argument that isn't NULL.",
      example: { sql: "SELECT COALESCE(nickname, name) FROM heroes;" },
    },
  ],
  challenges: [
    {
      id: "f-my-1",
      type: "query",
      prompt: "Return `name` and a `realm` column showing **Unaffiliated** when missing.",
      solution: "SELECT name, COALESCE(home_realm, 'Unaffiliated') AS realm FROM heroes;",
      grading: { checkColumnNames: true },
      hints: ["`COALESCE` takes two arguments here."],
      difficulty: "medium",
    },
  ],
}
```

Then run `npm run verify:content`. It will tell you if the solution doesn't execute,
returns no columns, or contradicts its own constraints.

**Challenge types:** `query`, `choice`, `predict`, `fill-blank`, `order`, `debug`.

**Dataset rules:** deterministic (no `random()`, no `now()` in stored values), small
enough to re-seed instantly, and self-documenting — column names should read like English
inside a query.

---

## SEO

Every public page ships server-rendered HTML with a canonical URL, Open Graph and Twitter
cards, and JSON-LD. The lesson pages are statically generated, so their teaching content
is in the markup rather than behind a client-side render.

Structured data: `Organization`, `WebSite` (+ `SearchAction`), `SoftwareApplication`,
`Course` per track, `LearningResource` per lesson, `BlogPosting`, `DefinedTerm` +
`DefinedTermSet` for the glossary, `FAQPage`, and `BreadcrumbList` throughout.
Plus `sitemap.xml` (114 URLs), `robots.txt`, an RSS feed and a web app manifest.

Deliberately **not** included: a fabricated `aggregateRating`. Inventing review counts
violates Google's structured-data policy and lies to users.

---

## Configuration

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | For production | Canonical URLs, sitemap, OG images. Inlined at build time. |
| `DATABASE_URL` | No | Accounts, sync, leaderboard. Absent → guest mode. |
| `AUTH_SECRET` | With a database | Session signing. `openssl rand -base64 32` |
| `AUTH_GITHUB_ID` / `_SECRET` | No | Shows the GitHub sign-in button |
| `AUTH_GOOGLE_ID` / `_SECRET` | No | Shows the Google sign-in button |
| `NEXT_PUBLIC_ANALYTICS_URL` | No | Self-hosted Plausible/Umami. Omit → no third-party scripts at all. |

---

## Accessibility

Targets WCAG 2.2 AA. Full keyboard operation, visible focus, live-region announcements for
answer feedback, `prefers-reduced-motion` honoured globally plus an in-app toggle, and
drag-and-drop challenges that also work with buttons. Known gaps are listed honestly at
`/accessibility` rather than glossed over.

---

## Licence

Code: **MIT**. Lesson content, datasets and articles: **CC BY-SA 4.0**.
Use it in a class, fork it, self-host it.
