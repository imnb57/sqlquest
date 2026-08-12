import type { Track } from "../types";

/**
 * Track 1 — Foundations.
 *
 * Everything here runs against the single-table `realm` dataset so learners
 * never have to reason about relationships before they can reason about rows.
 */
export const foundations: Track = {
  id: "foundations",
  slug: "foundations",
  title: "SQL Foundations",
  subtitle: "From zero to confident querying",
  description:
    "Start with your very first SELECT and finish able to filter, sort, and shape results from any table. No prior database experience needed — every exercise runs on a real Postgres engine in your browser.",
  level: "Beginner",
  glyph: "🌱",
  accent: "from-emerald-400 to-teal-500",
  outcomes: [
    "Read data out of a table with SELECT",
    "Filter rows precisely with WHERE, IN, BETWEEN and LIKE",
    "Handle NULL without falling into the classic traps",
    "Sort, paginate and rename your output",
  ],
  units: [
    /* ================================================== Unit 1: first queries */
    {
      id: "f-u1",
      slug: "first-queries",
      title: "Your First Queries",
      description: "Ask a database a question and read the answer.",
      accent: "emerald",
      lessons: [
        {
          id: "f-select-basics",
          slug: "select-basics",
          title: "SELECT: asking for columns",
          subtitle: "The one statement you'll write more than any other",
          objective: "Retrieve specific columns from a table",
          difficulty: "easy",
          estimatedMinutes: 6,
          datasetId: "realm",
          keywords: ["SELECT statement", "SQL basics", "query a table", "SELECT *"],
          concepts: [
            {
              title: "A query is a question",
              body: "SQL reads almost like English. `SELECT name FROM heroes` means \"give me the name column, from the heroes table\". The database figures out *how* to get it — you only say *what* you want.",
              example: {
                sql: "SELECT name\nFROM heroes;",
                caption: "One column, every row.",
              },
            },
            {
              title: "Asking for several columns",
              body: "Separate column names with commas. The order you list them is the order they come back in — the table's own column order doesn't matter.",
              example: { sql: "SELECT name, class, level\nFROM heroes;" },
            },
            {
              title: "The `*` shortcut",
              body: "`SELECT *` means \"every column\". It's perfect while exploring, but in real applications you should name the columns you need: it's faster, and your query won't silently change shape when someone adds a column.",
              tone: "tip",
              example: { sql: "SELECT *\nFROM heroes;" },
            },
          ],
          challenges: [
            {
              id: "f-sb-1",
              type: "query",
              prompt:
                "The realm keeps a roster in the **heroes** table. Return **every column** for **every hero**.",
              starter: "-- Your first query!\n",
              solution: "SELECT * FROM heroes;",
              hints: ["Start with the keyword `SELECT`.", "`*` is shorthand for all columns.", "`SELECT * FROM heroes;`"],
              explanation:
                "`SELECT *` returns all 9 columns. Great for exploring an unfamiliar table — that's usually the first query anyone runs.",
              difficulty: "easy",
            },
            {
              id: "f-sb-2",
              type: "query",
              prompt: "Now return **only** the `name` column from `heroes`.",
              solution: "SELECT name FROM heroes;",
              hints: ["Replace `*` with the column name."],
              explanation:
                "Naming columns explicitly is the habit to build: the database moves less data, and your result shape is predictable.",
              difficulty: "easy",
            },
            {
              id: "f-sb-3",
              type: "query",
              prompt:
                "Return the `name`, `class` and `level` of every hero — **in that order**.",
              solution: "SELECT name, class, level FROM heroes;",
              hints: ["Separate the three column names with commas."],
              difficulty: "easy",
            },
            {
              id: "f-sb-4",
              type: "choice",
              prompt: "Which clause tells the database **where the rows come from**?",
              options: [
                { id: "a", label: "SELECT", code: true },
                { id: "b", label: "FROM", code: true },
                { id: "c", label: "WHERE", code: true },
                { id: "d", label: "TABLE", code: true },
              ],
              correct: ["b"],
              explanation:
                "`SELECT` picks columns, `FROM` picks the source table, `WHERE` filters rows. `TABLE` isn't part of a normal query at all.",
              difficulty: "easy",
            },
            {
              id: "f-sb-5",
              type: "fill-blank",
              prompt: "Complete the query to fetch every hero's home realm.",
              template: "___ home_realm\n___ heroes;",
              answers: ["SELECT", "FROM"],
              distractors: ["WHERE", "ORDER BY", "GET"],
              difficulty: "easy",
            },
            {
              id: "f-sb-6",
              type: "order",
              prompt: "Put these clauses in the order SQL expects you to write them.",
              items: ["SELECT name, level", "FROM heroes", "WHERE level > 40", "ORDER BY level DESC"],
              explanation:
                "Writing order is SELECT → FROM → WHERE → ORDER BY. Interestingly, the database *evaluates* them in a different order (FROM, then WHERE, then SELECT, then ORDER BY) — which is why you can't use a SELECT alias inside WHERE.",
              difficulty: "medium",
            },
          ],
        },
        {
          id: "f-aliases",
          slug: "aliases-and-distinct",
          title: "Aliases & DISTINCT",
          subtitle: "Rename your output and remove duplicates",
          objective: "Rename result columns and collapse duplicate rows",
          difficulty: "easy",
          estimatedMinutes: 7,
          datasetId: "realm",
          requires: ["f-select-basics"],
          keywords: ["SQL AS alias", "SELECT DISTINCT", "remove duplicates SQL"],
          concepts: [
            {
              title: "`AS` renames a column",
              body: "The name a column comes back with is up to you. `AS` gives it a friendlier label — essential once you start computing values, which otherwise get names like `?column?`.",
              example: {
                sql: "SELECT name AS hero, gold AS purse\nFROM heroes;",
                caption: "The word `AS` is optional, but including it reads better.",
              },
            },
            {
              title: "Quoting an alias",
              body: 'Use double quotes when an alias contains spaces or capitals you want preserved: `SELECT gold AS "Gold Reserve"`. Single quotes are for *string values* — never for identifiers.',
              tone: "warning",
            },
            {
              title: "`DISTINCT` removes duplicate rows",
              body: "`SELECT DISTINCT class FROM heroes` gives each class once. Note it de-duplicates the *whole row*, not just the first column — `SELECT DISTINCT class, level` keeps every unique class+level pair.",
              example: { sql: "SELECT DISTINCT class\nFROM heroes;" },
            },
          ],
          challenges: [
            {
              id: "f-al-1",
              type: "query",
              prompt:
                "List every distinct `class` in the realm. One row per class, no repeats.",
              solution: "SELECT DISTINCT class FROM heroes;",
              hints: ["`DISTINCT` goes immediately after `SELECT`."],
              difficulty: "easy",
            },
            {
              id: "f-al-2",
              type: "query",
              prompt:
                "Return each hero's name in a column labelled **`hero_name`**, and their level in a column labelled **`power`**.",
              solution: "SELECT name AS hero_name, level AS power FROM heroes;",
              grading: { checkColumnNames: true },
              hints: ["Use `AS` after each column.", "`SELECT name AS hero_name, level AS power FROM heroes;`"],
              difficulty: "easy",
            },
            {
              id: "f-al-3",
              type: "query",
              prompt:
                "Return every distinct **combination** of `class` and `home_realm`.",
              solution: "SELECT DISTINCT class, home_realm FROM heroes;",
              explanation:
                "`DISTINCT` applies to the entire selected row, so this gives unique (class, home_realm) pairs — including the pairs where `home_realm` is NULL.",
              difficulty: "medium",
            },
            {
              id: "f-al-4",
              type: "predict",
              prompt:
                "The `heroes` table has 24 rows and 7 distinct classes. How many rows does this return?",
              query: "SELECT DISTINCT class, name FROM heroes;",
              options: [
                { id: "a", label: "7" },
                { id: "b", label: "24" },
                { id: "c", label: "1" },
                { id: "d", label: "It's an error" },
              ],
              correct: ["b"],
              explanation:
                "Every hero has a unique name, so every (class, name) pair is already distinct — `DISTINCT` removes nothing. This is the classic misunderstanding: DISTINCT is not a function applied to one column.",
              difficulty: "medium",
            },
            {
              id: "f-al-5",
              type: "debug",
              prompt: "This query should label the gold column `Treasure`. Find the broken line.",
              brokenSql: "SELECT\n  name,\n  gold AS 'Treasure'\nFROM heroes;",
              buggyLine: 2,
              fixedSql: 'SELECT\n  name,\n  gold AS "Treasure"\nFROM heroes;',
              explanation:
                "Single quotes make a *string literal*. Identifiers — table names, column names, aliases — use double quotes in standard SQL.",
              difficulty: "medium",
            },
          ],
        },
        {
          id: "f-expressions",
          slug: "expressions-and-math",
          title: "Computed columns",
          subtitle: "Make the database do the arithmetic",
          objective: "Build new columns from expressions and functions",
          difficulty: "easy",
          estimatedMinutes: 8,
          datasetId: "realm",
          requires: ["f-aliases"],
          keywords: ["SQL arithmetic", "computed column", "string concatenation SQL", "ROUND function"],
          concepts: [
            {
              title: "Columns can be expressions",
              body: "Anything you can compute, you can select. `SELECT gold * 2 FROM heroes` returns a column that doesn't exist in the table — it's derived per row.",
              example: {
                sql: "SELECT name, gold, gold * 0.1 AS tithe\nFROM heroes;",
              },
            },
            {
              title: "Joining text together",
              body: "`||` concatenates strings in standard SQL. Postgres also offers `concat()`, which is handy because it treats NULL as an empty string instead of poisoning the whole result.",
              example: {
                sql: "SELECT name || ' the ' || class AS title\nFROM heroes;",
              },
            },
            {
              title: "Integer division bites",
              body: "`7 / 2` is `3` in SQL, not `3.5`, because both operands are integers. Multiply by `1.0` or cast one side — `level / 10.0` — to get a decimal result.",
              tone: "warning",
              example: { sql: "SELECT 7 / 2 AS surprising, 7 / 2.0 AS expected;" },
            },
          ],
          challenges: [
            {
              id: "f-ex-1",
              type: "query",
              prompt:
                "For each hero return their `name` and a column `gold_after_tax` equal to their gold **minus 15%**.",
              solution: "SELECT name, gold - gold * 0.15 AS gold_after_tax FROM heroes;",
              hints: ["15% of gold is `gold * 0.15`.", "Subtract that from `gold`."],
              difficulty: "easy",
            },
            {
              id: "f-ex-2",
              type: "query",
              prompt:
                "Return a single column called `title` shaped like **`Ayla Stormcrest, level 42 Mage`** for every hero.",
              starter:
                "-- Build one text column from three pieces.\n-- Use || to glue them together, and remember the spaces.\n",
              solution:
                "SELECT name || ', level ' || level || ' ' || class AS title FROM heroes;",
              grading: { checkColumnNames: true },
              hints: [
                "Use `||` between each piece.",
                "Numbers concatenate into text automatically here.",
                "Don't forget the spaces inside your string literals.",
              ],
              difficulty: "medium",
            },
            {
              id: "f-ex-3",
              type: "query",
              prompt:
                "Return `name` and `hp_per_level`: hit points divided by level, **rounded to 2 decimal places**.",
              solution: "SELECT name, ROUND(hp / level::numeric, 2) AS hp_per_level FROM heroes;",
              hints: [
                "Both `hp` and `level` are integers — that's integer division.",
                "Cast one side: `hp / level::numeric`.",
                "Wrap it in `ROUND(..., 2)`.",
              ],
              explanation:
                "`ROUND(x, 2)` in Postgres needs a `numeric`, which is exactly why the cast is required. This pairing of integer division + rounding trips up almost everyone once.",
              difficulty: "medium",
            },
            {
              id: "f-ex-4",
              type: "predict",
              prompt: "What does this return?",
              query: "SELECT 10 / 4 AS a, 10 / 4.0 AS b;",
              options: [
                { id: "a", label: "a = 2.5,  b = 2.5" },
                { id: "b", label: "a = 2,    b = 2.5" },
                { id: "c", label: "a = 2,    b = 2" },
                { id: "d", label: "a = 3,    b = 2.5" },
              ],
              correct: ["b"],
              explanation:
                "Integer ÷ integer stays an integer and truncates toward zero. As soon as one side is `numeric`, the whole expression becomes numeric.",
              difficulty: "medium",
            },
            {
              id: "f-ex-5",
              type: "fill-blank",
              prompt: "Round each hero's gold to the nearest whole coin.",
              template: "SELECT name, ___(gold, ___) AS coins\nFROM heroes;",
              answers: ["ROUND", "0"],
              distractors: ["TRUNC", "2", "FLOOR"],
              difficulty: "easy",
            },
          ],
        },
      ],
    },

    /* ==================================================== Unit 2: filtering */
    {
      id: "f-u2",
      slug: "filtering",
      title: "Filtering Rows",
      description: "Narrow millions of rows down to the handful you care about.",
      accent: "sky",
      lessons: [
        {
          id: "f-where",
          slug: "where-basics",
          title: "WHERE: keeping the rows you want",
          subtitle: "Comparison operators and your first filter",
          objective: "Filter rows with comparison operators",
          difficulty: "easy",
          estimatedMinutes: 7,
          datasetId: "realm",
          requires: ["f-expressions"],
          keywords: ["SQL WHERE clause", "filter rows SQL", "comparison operators SQL"],
          concepts: [
            {
              title: "One test, run once per row",
              body: "`WHERE` is a yes/no question asked of every row independently. Rows that answer *true* survive; *false* and *unknown* are discarded.",
              example: { sql: "SELECT name, level\nFROM heroes\nWHERE level > 50;" },
            },
            {
              title: "The operators",
              body: "`=` equals, `<>` (or `!=`) not equals, `<` `>` `<=` `>=` for ordering. They work on numbers, text (alphabetical) and dates (chronological) alike.",
            },
            {
              title: "Strings need single quotes",
              body: "`WHERE class = 'Mage'` — single quotes, and the comparison is case-sensitive in Postgres. `'mage'` will match nothing.",
              tone: "warning",
            },
          ],
          challenges: [
            {
              id: "f-wh-1",
              type: "query",
              prompt: "Return the `name` and `level` of every hero **above level 50**.",
              solution: "SELECT name, level FROM heroes WHERE level > 50;",
              hints: ["Add a `WHERE` clause after `FROM heroes`."],
              difficulty: "easy",
            },
            {
              id: "f-wh-2",
              type: "query",
              prompt: "Return every column for heroes whose `class` is exactly **Rogue**.",
              solution: "SELECT * FROM heroes WHERE class = 'Rogue';",
              hints: ["Wrap the text in single quotes.", "Capitalisation matters."],
              difficulty: "easy",
            },
            {
              id: "f-wh-3",
              type: "query",
              prompt:
                "Find the `name`, `class` and `gold` of every hero carrying **at least 8000 gold**.",
              solution: "SELECT name, class, gold FROM heroes WHERE gold >= 8000;",
              hints: ["\"At least\" means `>=`."],
              difficulty: "easy",
            },
            {
              id: "f-wh-4",
              type: "query",
              prompt: "Return the `name` and `joined_on` of heroes who joined **before 2020**.",
              solution: "SELECT name, joined_on FROM heroes WHERE joined_on < '2020-01-01';",
              hints: [
                "Dates compare like numbers.",
                "Write the date as a quoted string: `'2020-01-01'`.",
              ],
              explanation:
                "Postgres parses `'2020-01-01'` into a date automatically because it's being compared to a `date` column. ISO format (YYYY-MM-DD) is unambiguous everywhere — always prefer it.",
              difficulty: "medium",
            },
            {
              id: "f-wh-5",
              type: "query",
              prompt:
                "Return the `name` of every hero who is **not** a Warrior.",
              solution: "SELECT name FROM heroes WHERE class <> 'Warrior';",
              hints: ["`<>` means \"not equal to\". `!=` also works."],
              difficulty: "easy",
            },
            {
              id: "f-wh-6",
              type: "debug",
              prompt: "This should find all Mages, but returns an error. Which line is wrong?",
              brokenSql: 'SELECT name\nFROM heroes\nWHERE class = "Mage";',
              buggyLine: 2,
              fixedSql: "SELECT name\nFROM heroes\nWHERE class = 'Mage';",
              explanation:
                'Double quotes make Postgres look for a *column* named `Mage`. String values always take single quotes — this is the single most common beginner error.',
              difficulty: "medium",
            },
          ],
        },
        {
          id: "f-logic",
          slug: "and-or-not",
          title: "Combining conditions",
          subtitle: "AND, OR, NOT — and the parentheses that save you",
          objective: "Combine multiple filters correctly",
          difficulty: "easy",
          estimatedMinutes: 8,
          datasetId: "realm",
          requires: ["f-where"],
          keywords: ["SQL AND OR", "boolean logic SQL", "operator precedence SQL"],
          concepts: [
            {
              title: "`AND` narrows, `OR` widens",
              body: "`AND` keeps rows satisfying *both* tests. `OR` keeps rows satisfying *either*. Chain as many as you like.",
              example: {
                sql: "SELECT name\nFROM heroes\nWHERE class = 'Mage' AND level > 40;",
              },
            },
            {
              title: "`AND` binds tighter than `OR`",
              body: "`A OR B AND C` means `A OR (B AND C)` — almost never what you meant. Add parentheses whenever you mix them; it costs nothing and prevents a whole category of silent bugs.",
              tone: "warning",
              example: {
                sql: "SELECT name\nFROM heroes\nWHERE (class = 'Mage' OR class = 'Warlock')\n  AND level > 40;",
              },
            },
            {
              title: "`NOT` inverts",
              body: "`WHERE NOT is_active` keeps the inactive heroes. For booleans you can skip the comparison entirely — `WHERE is_active` and `WHERE is_active = true` are the same thing.",
            },
          ],
          challenges: [
            {
              id: "f-lg-1",
              type: "query",
              prompt: "Find the `name` of every **Mage above level 40**.",
              solution: "SELECT name FROM heroes WHERE class = 'Mage' AND level > 40;",
              difficulty: "easy",
            },
            {
              id: "f-lg-2",
              type: "query",
              prompt:
                "Return `name` and `class` for heroes who are **either Rogues or Rangers**.",
              solution: "SELECT name, class FROM heroes WHERE class = 'Rogue' OR class = 'Ranger';",
              hints: ["Two conditions joined by `OR`."],
              difficulty: "easy",
            },
            {
              id: "f-lg-3",
              type: "query",
              prompt:
                "Find `name`, `class` and `level` for heroes who are **Mages or Warlocks**, **and** are **above level 40**. All three columns.",
              solution:
                "SELECT name, class, level FROM heroes WHERE (class = 'Mage' OR class = 'Warlock') AND level > 40;",
              hints: [
                "You'll need parentheses.",
                "Without them, `AND` binds first and you'd get all Mages regardless of level.",
              ],
              explanation:
                "This is the precedence trap in miniature. Drop the parentheses and the query silently returns extra rows — no error, just a wrong answer.",
              difficulty: "medium",
            },
            {
              id: "f-lg-4",
              type: "query",
              prompt: "Return the `name` of every hero who is **not currently active**.",
              solution: "SELECT name FROM heroes WHERE NOT is_active;",
              hints: ["`is_active` is already a boolean — no `=` needed."],
              difficulty: "easy",
            },
            {
              id: "f-lg-5",
              type: "predict",
              prompt:
                "Given precedence rules, which heroes does this return?",
              query:
                "SELECT name FROM heroes\nWHERE class = 'Mage' OR class = 'Rogue' AND level > 45;",
              options: [
                { id: "a", label: "Mages and Rogues, all above level 45" },
                { id: "b", label: "All Mages, plus Rogues above level 45" },
                { id: "c", label: "Only heroes above level 45" },
                { id: "d", label: "Nothing — it's a syntax error" },
              ],
              correct: ["b"],
              explanation:
                "`AND` evaluates first, so this reads `class = 'Mage' OR (class = 'Rogue' AND level > 45)`. Every Mage qualifies at any level.",
              difficulty: "hard",
            },
            {
              id: "f-lg-6",
              type: "query",
              prompt:
                "Find `name` and `gold` for **active** heroes from **Northwind** carrying **more than 4000 gold**.",
              solution:
                "SELECT name, gold FROM heroes WHERE is_active AND home_realm = 'Northwind' AND gold > 4000;",
              difficulty: "medium",
            },
          ],
        },
        {
          id: "f-in-between-like",
          slug: "in-between-like",
          title: "IN, BETWEEN & LIKE",
          subtitle: "Shortcuts that make filters readable",
          objective: "Filter with set membership, ranges and patterns",
          difficulty: "medium",
          estimatedMinutes: 9,
          datasetId: "realm",
          requires: ["f-logic"],
          keywords: ["SQL IN operator", "SQL BETWEEN", "SQL LIKE wildcard", "pattern matching SQL"],
          concepts: [
            {
              title: "`IN` replaces a stack of ORs",
              body: "`WHERE class IN ('Mage', 'Warlock', 'Cleric')` is exactly `class = 'Mage' OR class = 'Warlock' OR class = 'Cleric'` — just readable.",
              example: {
                sql: "SELECT name, class\nFROM heroes\nWHERE class IN ('Mage', 'Warlock');",
              },
            },
            {
              title: "`BETWEEN` is inclusive at both ends",
              body: "`level BETWEEN 30 AND 40` includes 30 *and* 40. That surprises people with dates and timestamps: `BETWEEN '2024-01-01' AND '2024-01-31'` silently excludes almost all of January 31st, because the timestamp `2024-01-31 09:00` is greater than midnight.",
              tone: "warning",
            },
            {
              title: "`LIKE` matches patterns",
              body: "`%` matches any run of characters, `_` matches exactly one. `LIKE 'A%'` finds names starting with A; `LIKE '%vale'` finds names ending in \"vale\". Postgres adds `ILIKE` for a case-insensitive match.",
              example: {
                sql: "SELECT name\nFROM heroes\nWHERE name ILIKE '%stone%';",
              },
            },
          ],
          challenges: [
            {
              id: "f-ib-1",
              type: "query",
              prompt:
                "Using `IN`, return `name` and `class` for every **Cleric, Ranger or Warlock**.",
              solution:
                "SELECT name, class FROM heroes WHERE class IN ('Cleric', 'Ranger', 'Warlock');",
              grading: {
                mustUse: [{ pattern: "\\bin\\s*\\(", label: "the `IN` operator" }],
              },
              difficulty: "easy",
            },
            {
              id: "f-ib-2",
              type: "query",
              prompt:
                "Using `BETWEEN`, return `name` and `level` for heroes between **level 30 and level 45** inclusive.",
              solution: "SELECT name, level FROM heroes WHERE level BETWEEN 30 AND 45;",
              grading: { mustUse: [{ pattern: "\\bbetween\\b", label: "`BETWEEN`" }] },
              difficulty: "easy",
            },
            {
              id: "f-ib-3",
              type: "query",
              prompt:
                "Find the `name` of every hero whose name **contains** the letters `wind` (any case).",
              solution: "SELECT name FROM heroes WHERE name ILIKE '%wind%';",
              hints: ["`%` on both sides means \"anywhere in the string\".", "`ILIKE` ignores case."],
              difficulty: "medium",
            },
            {
              id: "f-ib-4",
              type: "query",
              prompt: "Return the `name` of heroes whose name **starts with** the letter `A`.",
              solution: "SELECT name FROM heroes WHERE name LIKE 'A%';",
              difficulty: "easy",
            },
            {
              id: "f-ib-5",
              type: "query",
              prompt:
                "Return `name` and `home_realm` for heroes **not** from Northwind or Emberreach. (Heroes with no realm recorded can be left out.)",
              solution:
                "SELECT name, home_realm FROM heroes WHERE home_realm NOT IN ('Northwind', 'Emberreach');",
              explanation:
                "Note that `NOT IN` quietly drops the NULL-realm heroes: `NULL NOT IN (...)` evaluates to unknown, never true. You'll meet this properly in the next lesson.",
              difficulty: "medium",
            },
            {
              id: "f-ib-6",
              type: "predict",
              prompt:
                "`orders.placed_at` is a `timestamp`. Which January orders does this miss?",
              query:
                "SELECT * FROM orders\nWHERE placed_at BETWEEN '2024-01-01' AND '2024-01-31';",
              options: [
                { id: "a", label: "None — it's inclusive" },
                { id: "b", label: "Everything after midnight on Jan 31" },
                { id: "c", label: "Everything on Jan 1" },
                { id: "d", label: "Every order — the syntax is invalid" },
              ],
              correct: ["b"],
              explanation:
                "`'2024-01-31'` becomes `2024-01-31 00:00:00`, so an order at 09:15 that day is *after* the upper bound. The safe idiom is `>= '2024-01-01' AND < '2024-02-01'`.",
              difficulty: "hard",
            },
          ],
        },
        {
          id: "f-nulls",
          slug: "working-with-null",
          title: "NULL: the absence of a value",
          subtitle: "Three-valued logic, and how not to get caught by it",
          objective: "Test for and handle missing values correctly",
          difficulty: "medium",
          estimatedMinutes: 9,
          datasetId: "realm",
          requires: ["f-in-between-like"],
          keywords: ["SQL NULL", "IS NULL", "COALESCE", "three valued logic"],
          concepts: [
            {
              title: "NULL isn't a value — it's a hole",
              body: "NULL means *unknown*. It isn't zero, and it isn't an empty string. Two unknowns aren't equal to each other, so `NULL = NULL` is **not** true — it's unknown.",
            },
            {
              title: "That's why `= NULL` never works",
              body: "`WHERE home_realm = NULL` returns nothing, ever — not an error, just silence. Use `IS NULL` and `IS NOT NULL`, which are the only operators that can see a hole.",
              tone: "warning",
              example: {
                sql: "SELECT name\nFROM heroes\nWHERE home_realm IS NULL;",
              },
            },
            {
              title: "`COALESCE` supplies a fallback",
              body: "`COALESCE(a, b, c)` returns the first non-NULL argument. It's how you turn missing data into something displayable without touching the stored rows.",
              example: {
                sql: "SELECT name, COALESCE(home_realm, 'Wanderer') AS realm\nFROM heroes;",
              },
            },
            {
              title: "`NULLIF` does the reverse",
              body: "`NULLIF(x, y)` returns NULL when `x = y`. The classic use is `NULLIF(divisor, 0)` to turn a division-by-zero error into a harmless NULL.",
              tone: "tip",
            },
          ],
          challenges: [
            {
              id: "f-nl-1",
              type: "query",
              prompt: "Return the `name` of every hero with **no home realm recorded**.",
              solution: "SELECT name FROM heroes WHERE home_realm IS NULL;",
              hints: ["`= NULL` won't work. What's the operator that does?"],
              difficulty: "easy",
            },
            {
              id: "f-nl-2",
              type: "query",
              prompt:
                "Return `name` and a column `realm` that shows the home realm, or the text **`Unaffiliated`** when it's missing.",
              solution:
                "SELECT name, COALESCE(home_realm, 'Unaffiliated') AS realm FROM heroes;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "f-nl-3",
              type: "query",
              prompt:
                "Return `name` and `home_realm` for heroes who **do** have a realm recorded, sorted by name A→Z.",
              solution:
                "SELECT name, home_realm FROM heroes WHERE home_realm IS NOT NULL ORDER BY name;",
              difficulty: "easy",
            },
            {
              id: "f-nl-4",
              type: "choice",
              prompt: "What does `NULL = NULL` evaluate to in SQL?",
              options: [
                { id: "a", label: "true" },
                { id: "b", label: "false" },
                { id: "c", label: "NULL (unknown)" },
                { id: "d", label: "An error" },
              ],
              correct: ["c"],
              explanation:
                "SQL uses three-valued logic: true, false, and unknown. Comparing two unknowns gives unknown, and `WHERE` only keeps rows that are definitively true.",
              difficulty: "medium",
            },
            {
              id: "f-nl-5",
              type: "predict",
              prompt:
                "24 heroes exist; 3 have a NULL `home_realm`. How many rows come back?",
              query: "SELECT name FROM heroes WHERE home_realm <> 'Northwind';",
              options: [
                { id: "a", label: "All heroes not from Northwind, including the 3 NULLs" },
                { id: "b", label: "All heroes not from Northwind, excluding the 3 NULLs" },
                { id: "c", label: "24" },
                { id: "d", label: "0" },
              ],
              correct: ["b"],
              explanation:
                "`NULL <> 'Northwind'` is unknown, not true, so those rows are filtered out. If you want them, say so: `WHERE home_realm <> 'Northwind' OR home_realm IS NULL`.",
              difficulty: "hard",
            },
            {
              id: "f-nl-6",
              type: "query",
              prompt:
                "Return `name`, and `gold_per_level` = gold ÷ level — but return NULL instead of erroring if a hero were ever level 0. Round to 2 decimals.",
              solution:
                "SELECT name, ROUND(gold / NULLIF(level, 0), 2) AS gold_per_level FROM heroes;",
              hints: ["Wrap the divisor in `NULLIF(level, 0)`."],
              explanation:
                "This is defensive SQL you'll write constantly in real reporting — one zero in a denominator otherwise kills the whole query.",
              difficulty: "hard",
            },
          ],
        },
      ],
    },

    /* ================================================ Unit 3: shaping output */
    {
      id: "f-u3",
      slug: "shaping-results",
      title: "Shaping Results",
      description: "Sort, slice and page through your answers.",
      accent: "violet",
      lessons: [
        {
          id: "f-order-by",
          slug: "order-by",
          title: "ORDER BY",
          subtitle: "Rows have no order until you give them one",
          objective: "Sort results by one or more columns",
          difficulty: "easy",
          estimatedMinutes: 7,
          datasetId: "realm",
          requires: ["f-nulls"],
          keywords: ["SQL ORDER BY", "sort results SQL", "NULLS LAST", "descending order SQL"],
          concepts: [
            {
              title: "Without ORDER BY, order is undefined",
              body: "A table is a *set* of rows. The order you happen to see is an accident of how the database read them, and it can change between runs. If order matters, say so explicitly — always.",
              tone: "warning",
            },
            {
              title: "ASC and DESC",
              body: "`ORDER BY level` sorts ascending (the default). `ORDER BY level DESC` puts the highest first. Each column gets its own direction: `ORDER BY class ASC, level DESC`.",
              example: {
                sql: "SELECT name, class, level\nFROM heroes\nORDER BY class, level DESC;",
              },
            },
            {
              title: "Where NULLs land",
              body: "Postgres sorts NULLs *last* ascending and *first* descending. Override it with `ORDER BY home_realm NULLS LAST` when you want the holes out of the way.",
              tone: "tip",
            },
          ],
          challenges: [
            {
              id: "f-ob-1",
              type: "query",
              prompt: "List `name` and `level` of all heroes, **highest level first**.",
              solution: "SELECT name, level FROM heroes ORDER BY level DESC;",
              difficulty: "easy",
            },
            {
              id: "f-ob-2",
              type: "query",
              prompt: "List `name` and `gold` sorted by gold, **poorest first**.",
              solution: "SELECT name, gold FROM heroes ORDER BY gold ASC;",
              difficulty: "easy",
            },
            {
              id: "f-ob-3",
              type: "query",
              prompt:
                "List `class`, `name` and `level` grouped visually by class **A→Z**, and within each class show the **highest level first**.",
              solution: "SELECT class, name, level FROM heroes ORDER BY class, level DESC;",
              hints: ["Two sort keys, comma-separated.", "Only the second one needs `DESC`."],
              difficulty: "medium",
            },
            {
              id: "f-ob-4",
              type: "query",
              prompt:
                "List `name` and `home_realm` sorted by realm A→Z, with the **unknown realms last**.",
              solution: "SELECT name, home_realm FROM heroes ORDER BY home_realm NULLS LAST, name;",
              hints: ["`NULLS LAST` goes right after the column."],
              difficulty: "medium",
            },
            {
              id: "f-ob-5",
              type: "choice",
              prompt:
                "You run the same `SELECT * FROM heroes` twice with no ORDER BY and get different row orders. What happened?",
              options: [
                { id: "a", label: "The data changed" },
                { id: "b", label: "Nothing is wrong — row order is undefined without ORDER BY" },
                { id: "c", label: "The query is invalid" },
                { id: "d", label: "The table needs re-indexing" },
              ],
              correct: ["b"],
              explanation:
                "Plan changes, parallel workers, or a background update can all reorder results. Never rely on incidental ordering — this causes real production bugs.",
              difficulty: "medium",
            },
          ],
        },
        {
          id: "f-limit",
          slug: "limit-and-offset",
          title: "LIMIT & OFFSET",
          subtitle: "Top-N results and pagination",
          objective: "Return a bounded slice of a result set",
          difficulty: "easy",
          estimatedMinutes: 6,
          datasetId: "realm",
          requires: ["f-order-by"],
          keywords: ["SQL LIMIT", "SQL OFFSET", "pagination SQL", "top N query"],
          concepts: [
            {
              title: "`LIMIT` caps the row count",
              body: "`LIMIT 5` returns at most five rows. Paired with `ORDER BY`, it answers every \"top N\" question you'll ever be asked.",
              example: {
                sql: "SELECT name, gold\nFROM heroes\nORDER BY gold DESC\nLIMIT 3;",
              },
            },
            {
              title: "`OFFSET` skips ahead",
              body: "`LIMIT 10 OFFSET 20` is page 3 of a 10-per-page list. Be aware that the database still has to walk past those 20 rows — deep pagination gets slow, and keyset pagination (`WHERE id > :last_id`) scales far better.",
              tone: "tip",
            },
            {
              title: "LIMIT without ORDER BY is a coin flip",
              body: "\"Give me any 5 rows\" is a legitimate request; \"give me the top 5\" is not the same thing. Without `ORDER BY`, `LIMIT` returns whichever rows arrived first.",
              tone: "warning",
            },
          ],
          challenges: [
            {
              id: "f-lm-1",
              type: "query",
              prompt: "Return the `name` and `gold` of the **3 richest heroes**.",
              solution: "SELECT name, gold FROM heroes ORDER BY gold DESC LIMIT 3;",
              difficulty: "easy",
            },
            {
              id: "f-lm-2",
              type: "query",
              prompt:
                "Return `name` and `level` for the **5 lowest-level heroes**, weakest first.",
              solution: "SELECT name, level FROM heroes ORDER BY level ASC LIMIT 5;",
              difficulty: "easy",
            },
            {
              id: "f-lm-3",
              type: "query",
              prompt:
                "The roster is shown 5 per page sorted by `name` A→Z. Return **page 3** (`name` and `class`).",
              solution: "SELECT name, class FROM heroes ORDER BY name LIMIT 5 OFFSET 10;",
              hints: ["Page 3 starts after 2 full pages.", "2 × 5 = 10 rows to skip."],
              difficulty: "medium",
            },
            {
              id: "f-lm-4",
              type: "query",
              prompt:
                "Who is the **single wealthiest active** hero? Return their `name` and `gold`.",
              solution:
                "SELECT name, gold FROM heroes WHERE is_active ORDER BY gold DESC LIMIT 1;",
              difficulty: "medium",
            },
            {
              id: "f-lm-5",
              type: "order",
              prompt: "Arrange this top-N query into valid SQL.",
              items: [
                "SELECT name, gold",
                "FROM heroes",
                "WHERE is_active",
                "ORDER BY gold DESC",
                "LIMIT 5",
              ],
              difficulty: "easy",
            },
          ],
        },
        {
          id: "f-boss",
          slug: "foundations-checkpoint",
          title: "Checkpoint: The Gatekeeper",
          subtitle: "Prove you can query a table from memory",
          objective: "Combine SELECT, WHERE, ORDER BY and LIMIT under pressure",
          difficulty: "medium",
          estimatedMinutes: 12,
          datasetId: "realm",
          kind: "boss",
          requires: ["f-limit"],
          keywords: ["SQL practice test", "SQL exercises beginner"],
          concepts: [
            {
              title: "No hints on the first try",
              body: "This checkpoint pulls together everything from the track. Take your time — you can still reveal hints, they just cost a little XP.",
            },
          ],
          challenges: [
            {
              id: "f-bs-1",
              type: "query",
              prompt:
                "Return `name`, `class` and `gold` for the **top 5 richest active heroes above level 35**, richest first.",
              solution:
                "SELECT name, class, gold FROM heroes WHERE is_active AND level > 35 ORDER BY gold DESC LIMIT 5;",
              difficulty: "medium",
            },
            {
              id: "f-bs-2",
              type: "query",
              prompt:
                "Return `name` and `home_realm` for heroes who are **either from Duskvale or have no realm at all**, sorted by name.",
              solution:
                "SELECT name, home_realm FROM heroes WHERE home_realm = 'Duskvale' OR home_realm IS NULL ORDER BY name;",
              hints: ["Remember NULL needs its own test."],
              difficulty: "medium",
            },
            {
              id: "f-bs-3",
              type: "query",
              prompt:
                "Return a column `roster` shaped like **`Bram Ironfoot (Warrior, 51)`** for every hero at **level 45 or above**, sorted alphabetically by name.",
              solution:
                "SELECT name || ' (' || class || ', ' || level || ')' AS roster FROM heroes WHERE level >= 45 ORDER BY name;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "f-bs-4",
              type: "query",
              prompt:
                "Return `name`, `class`, and `wealth_band` — but for this one just return `name` and `gold` for heroes whose gold is **between 2000 and 8000** and who are **not Warriors**, cheapest first.",
              solution:
                "SELECT name, gold FROM heroes WHERE gold BETWEEN 2000 AND 8000 AND class <> 'Warrior' ORDER BY gold;",
              difficulty: "medium",
            },
            {
              id: "f-bs-5",
              type: "query",
              prompt:
                "List the distinct `class` values of heroes who joined **in 2022 or later**, alphabetically.",
              solution:
                "SELECT DISTINCT class FROM heroes WHERE joined_on >= '2022-01-01' ORDER BY class;",
              difficulty: "medium",
            },
            {
              id: "f-bs-6",
              type: "query",
              prompt:
                "Return the `name` and `hp` of the **second-toughest** hero (2nd highest `hp`).",
              solution: "SELECT name, hp FROM heroes ORDER BY hp DESC LIMIT 1 OFFSET 1;",
              hints: ["Sort descending, then skip the first row."],
              explanation:
                "`LIMIT 1 OFFSET 1` is the simplest \"Nth largest\" pattern. Later you'll see window functions handle ties properly.",
              difficulty: "hard",
            },
          ],
        },
      ],
    },
  ],
};
