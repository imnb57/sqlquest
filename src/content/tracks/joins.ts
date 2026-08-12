import type { Track } from "../types";

/**
 * Track 2 — Joins & Relationships.
 * Primary dataset: `guild` (guilds ← heroes → quest_log → quests).
 * The self-join lesson switches to `org` because a manager hierarchy is the
 * clearest possible motivation for joining a table to itself.
 */
export const joins: Track = {
  id: "joins",
  slug: "joins",
  title: "Joins & Relationships",
  subtitle: "Make separate tables answer one question",
  description:
    "Real databases spread information across many tables. Learn how keys connect them, which join type to reach for, and how to spot the row-count explosions that catch out even experienced engineers.",
  level: "Intermediate",
  glyph: "🔗",
  accent: "from-sky-400 to-indigo-500",
  outcomes: [
    "Read a schema and spot the keys that link tables",
    "Choose confidently between INNER, LEFT, RIGHT and FULL joins",
    "Join three or more tables without losing rows",
    "Use a self-join to compare rows within one table",
  ],
  units: [
    {
      id: "j-u1",
      slug: "relating-tables",
      title: "Relating Tables",
      description: "Keys, cardinality, and your first JOIN.",
      accent: "sky",
      lessons: [
        {
          id: "j-keys",
          slug: "keys-and-relationships",
          title: "Keys & relationships",
          subtitle: "Why data lives in more than one table",
          objective: "Identify primary and foreign keys in a schema",
          difficulty: "easy",
          estimatedMinutes: 7,
          datasetId: "guild",
          keywords: ["primary key", "foreign key", "database relationships", "normalization"],
          concepts: [
            {
              title: "One fact, one place",
              body: "If every hero row carried its guild's city, changing that city would mean updating dozens of rows — and any one you miss becomes a contradiction. Instead the guild lives once in `guilds`, and heroes point at it.",
            },
            {
              title: "Primary key: the row's identity",
              body: "A **primary key** uniquely identifies a row. `guilds.id` is one. It's never NULL and never duplicated.",
            },
            {
              title: "Foreign key: the pointer",
              body: "A **foreign key** is a column holding another table's primary key. `heroes.guild_id` points at `guilds.id`. That single link is what a JOIN follows.",
              example: {
                sql: "-- heroes.guild_id  →  guilds.id\nSELECT h.name, g.name AS guild\nFROM heroes h\nJOIN guilds g ON h.guild_id = g.id;",
              },
            },
            {
              title: "A foreign key can be NULL",
              body: "`heroes.guild_id` is nullable — some heroes are freelancers. That NULL is exactly why LEFT JOIN exists, as you'll see shortly.",
              tone: "tip",
            },
          ],
          challenges: [
            {
              id: "j-k-1",
              type: "choice",
              prompt: "Which column in `quest_log` is a **foreign key**?",
              options: [
                { id: "a", label: "id" },
                { id: "b", label: "hero_id" },
                { id: "c", label: "status" },
                { id: "d", label: "attempted_on" },
              ],
              correct: ["b"],
              explanation:
                "`hero_id` (and `quest_id`) point at other tables' primary keys. `id` is `quest_log`'s own primary key.",
              difficulty: "easy",
            },
            {
              id: "j-k-2",
              type: "choice",
              prompt:
                "One guild has many heroes; each hero belongs to at most one guild. What relationship is that?",
              options: [
                { id: "a", label: "One-to-one" },
                { id: "b", label: "One-to-many" },
                { id: "c", label: "Many-to-many" },
                { id: "d", label: "Self-referencing" },
              ],
              correct: ["b"],
              explanation:
                "One-to-many is the most common shape in relational design. The foreign key always lives on the *many* side — here, on `heroes`.",
              difficulty: "easy",
            },
            {
              id: "j-k-3",
              type: "choice",
              prompt:
                "`quest_log` sits between `heroes` and `quests`, with a foreign key to each. What is it modelling?",
              options: [
                { id: "a", label: "A one-to-one relationship" },
                { id: "b", label: "A many-to-many relationship between heroes and quests" },
                { id: "c", label: "A duplicate of the heroes table" },
                { id: "d", label: "A materialised view" },
              ],
              correct: ["b"],
              explanation:
                "A hero can attempt many quests and a quest can be attempted by many heroes. A **junction table** resolves that, and it can carry its own facts — here `status` and `gold_earned`.",
              difficulty: "medium",
            },
            {
              id: "j-k-4",
              type: "query",
              prompt:
                "Before joining anything: return every column of `guilds`, ordered by `reputation` descending.",
              solution: "SELECT * FROM guilds ORDER BY reputation DESC;",
              difficulty: "easy",
            },
            {
              id: "j-k-5",
              type: "query",
              prompt:
                "Which heroes have **no guild**? Return their `name`, sorted alphabetically.",
              solution: "SELECT name FROM heroes WHERE guild_id IS NULL ORDER BY name;",
              difficulty: "easy",
            },
          ],
        },
        {
          id: "j-inner",
          slug: "inner-join",
          title: "INNER JOIN",
          subtitle: "Rows that match on both sides",
          objective: "Combine two tables on a matching key",
          difficulty: "medium",
          estimatedMinutes: 10,
          datasetId: "guild",
          requires: ["j-keys"],
          keywords: ["INNER JOIN", "SQL JOIN tutorial", "join two tables", "join on"],
          concepts: [
            {
              title: "The anatomy of a join",
              body: "`FROM heroes JOIN guilds ON heroes.guild_id = guilds.id` says: for each hero, find guild rows where the ids line up, and stitch the columns together into one wide row. Unmatched rows on *either* side are dropped.",
              example: {
                sql: "SELECT heroes.name, guilds.name AS guild\nFROM heroes\nJOIN guilds ON heroes.guild_id = guilds.id;",
              },
            },
            {
              title: "Table aliases keep it readable",
              body: "`FROM heroes h JOIN guilds g ON h.guild_id = g.id` — short aliases make multi-table queries far easier to scan. Once two tables share a column name (both have `name` here), qualifying becomes mandatory.",
              tone: "tip",
            },
            {
              title: "`JOIN` means `INNER JOIN`",
              body: "The `INNER` keyword is optional. Writing it out is a kindness to whoever reads the query next, because the *absence* of `LEFT` is easy to miss.",
            },
          ],
          challenges: [
            {
              id: "j-in-1",
              type: "query",
              prompt:
                "Return each hero's `name` and their guild's name as `guild`. Only heroes who are in a guild. Sort by hero name.",
              starter: "SELECT h.name, g.name AS guild\nFROM heroes h\n-- join guilds here\nORDER BY h.name;",
              solution:
                "SELECT h.name, g.name AS guild FROM heroes h JOIN guilds g ON h.guild_id = g.id ORDER BY h.name;",
              hints: [
                "`JOIN guilds g ON ...`",
                "The link is `h.guild_id = g.id`.",
              ],
              difficulty: "medium",
            },
            {
              id: "j-in-2",
              type: "query",
              prompt:
                "Return `name`, `class` and the guild's `city` for every guilded hero, sorted by city then name.",
              solution:
                "SELECT h.name, h.class, g.city FROM heroes h JOIN guilds g ON h.guild_id = g.id ORDER BY g.city, h.name;",
              difficulty: "medium",
            },
            {
              id: "j-in-3",
              type: "query",
              prompt:
                "Join `quest_log` to `quests`. Return the hero id as `hero_id`, the quest `title`, and the `status`, for **completed** attempts only. Sort by `hero_id` then `title`.",
              solution:
                "SELECT ql.hero_id, q.title, ql.status FROM quest_log ql JOIN quests q ON ql.quest_id = q.id WHERE ql.status = 'completed' ORDER BY ql.hero_id, q.title;",
              difficulty: "medium",
            },
            {
              id: "j-in-4",
              type: "predict",
              prompt:
                "`heroes` has 18 rows, 2 of which have `guild_id IS NULL`. How many rows does this return?",
              query: "SELECT * FROM heroes h JOIN guilds g ON h.guild_id = g.id;",
              options: [
                { id: "a", label: "18" },
                { id: "b", label: "16" },
                { id: "c", label: "5" },
                { id: "d", label: "90" },
              ],
              correct: ["b"],
              explanation:
                "An inner join drops rows with no match, and `NULL = anything` is never true — so the two guildless heroes vanish. Silently losing rows this way is the #1 cause of wrong numbers in reports.",
              difficulty: "hard",
            },
            {
              id: "j-in-5",
              type: "fill-blank",
              prompt: "Complete the join between heroes and their guild.",
              template:
                "SELECT h.name, g.name AS guild\nFROM heroes h\n___ guilds g ___ h.___ = g.id;",
              answers: ["JOIN", "ON", "guild_id"],
              distractors: ["WHERE", "USING", "id", "LEFT"],
              difficulty: "easy",
            },
            {
              id: "j-in-6",
              type: "debug",
              prompt:
                "Both tables have a `name` column. Find the line that makes this ambiguous.",
              brokenSql:
                "SELECT name, city\nFROM heroes h\nJOIN guilds g ON h.guild_id = g.id;",
              buggyLine: 0,
              fixedSql:
                "SELECT h.name, g.city\nFROM heroes h\nJOIN guilds g ON h.guild_id = g.id;",
              explanation:
                "`column reference \"name\" is ambiguous` — Postgres can't guess which table you meant. Qualify every column once more than one table is in play.",
              difficulty: "medium",
            },
          ],
        },
        {
          id: "j-left",
          slug: "left-join",
          title: "LEFT JOIN",
          subtitle: "Keep every row on the left, matched or not",
          objective: "Preserve unmatched rows and find missing relationships",
          difficulty: "medium",
          estimatedMinutes: 10,
          datasetId: "guild",
          requires: ["j-inner"],
          keywords: ["LEFT JOIN", "LEFT OUTER JOIN", "find missing rows SQL", "anti join"],
          concepts: [
            {
              title: "Left means \"the table you started from\"",
              body: "`FROM heroes LEFT JOIN guilds` keeps **every** hero. Where no guild matches, the guild columns come back as NULL rather than the row disappearing.",
              example: {
                sql: "SELECT h.name, g.name AS guild\nFROM heroes h\nLEFT JOIN guilds g ON h.guild_id = g.id;",
                caption: "Guildless heroes appear with guild = NULL.",
              },
            },
            {
              title: "The anti-join pattern",
              body: "Add `WHERE g.id IS NULL` and you get exactly the rows that *didn't* match — \"customers with no orders\", \"heroes with no guild\". This is one of the highest-value patterns in everyday SQL.",
              tone: "tip",
              example: {
                sql: "SELECT h.name\nFROM heroes h\nLEFT JOIN guilds g ON h.guild_id = g.id\nWHERE g.id IS NULL;",
              },
            },
            {
              title: "WHERE undoes a LEFT JOIN",
              body: "Putting a condition on the right-hand table in `WHERE` filters out the NULL rows and quietly turns your LEFT JOIN back into an INNER JOIN. If the condition belongs to the join, put it in `ON`.",
              tone: "warning",
              example: {
                sql: "-- Wrong: drops unmatched heroes\n... LEFT JOIN guilds g ON h.guild_id = g.id\nWHERE g.city = 'Northwind'\n\n-- Right: keeps them\n... LEFT JOIN guilds g\n     ON h.guild_id = g.id AND g.city = 'Northwind'",
              },
            },
          ],
          challenges: [
            {
              id: "j-lf-1",
              type: "query",
              prompt:
                "Return **every** hero's `name` alongside their guild's name as `guild` — including heroes with no guild. Sort by name.",
              solution:
                "SELECT h.name, g.name AS guild FROM heroes h LEFT JOIN guilds g ON h.guild_id = g.id ORDER BY h.name;",
              grading: { mustUse: [{ pattern: "\\bleft\\s+(outer\\s+)?join\\b", label: "a `LEFT JOIN`" }] },
              difficulty: "medium",
            },
            {
              id: "j-lf-2",
              type: "query",
              prompt:
                "Show every hero's `name` with the guild name replaced by **`Freelancer`** when they have none. Call the column `guild`. Sort by name.",
              solution:
                "SELECT h.name, COALESCE(g.name, 'Freelancer') AS guild FROM heroes h LEFT JOIN guilds g ON h.guild_id = g.id ORDER BY h.name;",
              hints: ["Combine `LEFT JOIN` with `COALESCE`."],
              difficulty: "medium",
            },
            {
              id: "j-lf-3",
              type: "query",
              prompt:
                "Which quests has **nobody ever attempted**? Return the quest `title`, sorted alphabetically. Use a LEFT JOIN.",
              solution:
                "SELECT q.title FROM quests q LEFT JOIN quest_log ql ON ql.quest_id = q.id WHERE ql.id IS NULL ORDER BY q.title;",
              grading: { mustUse: [{ pattern: "\\bleft\\s+(outer\\s+)?join\\b", label: "a `LEFT JOIN`" }] },
              hints: [
                "Start `FROM quests` so quests are the preserved side.",
                "Unmatched rows have NULL in every `quest_log` column.",
              ],
              explanation:
                "This is the anti-join. Always test `IS NULL` on a column that can never be NULL in a real match — the primary key is the safe choice.",
              difficulty: "hard",
            },
            {
              id: "j-lf-4",
              type: "predict",
              prompt: "What does this actually return?",
              query:
                "SELECT h.name, g.name\nFROM heroes h\nLEFT JOIN guilds g ON h.guild_id = g.id\nWHERE g.city = 'Duskvale';",
              options: [
                { id: "a", label: "All heroes, with NULL guilds outside Duskvale" },
                { id: "b", label: "Only heroes in the Duskvale guild — the LEFT JOIN is neutralised" },
                { id: "c", label: "All heroes with no guild" },
                { id: "d", label: "An error" },
              ],
              correct: ["b"],
              explanation:
                "`WHERE g.city = 'Duskvale'` is false for NULL rows, so they're filtered away. Move the condition into `ON` to keep them.",
              difficulty: "hard",
            },
            {
              id: "j-lf-5",
              type: "query",
              prompt:
                "Return every hero's `name` and, **only if their guild is in Duskvale**, that guild's `city` — heroes elsewhere should still appear, with NULL. Sort by name.",
              solution:
                "SELECT h.name, g.city FROM heroes h LEFT JOIN guilds g ON h.guild_id = g.id AND g.city = 'Duskvale' ORDER BY h.name;",
              hints: ["The city condition belongs in `ON`, not `WHERE`."],
              difficulty: "expert",
            },
          ],
        },
        {
          id: "j-outer",
          slug: "right-and-full-joins",
          title: "RIGHT & FULL joins",
          subtitle: "The rest of the join family",
          objective: "Understand every outer join variant and when each is useful",
          difficulty: "medium",
          estimatedMinutes: 8,
          datasetId: "guild",
          requires: ["j-left"],
          keywords: ["RIGHT JOIN", "FULL OUTER JOIN", "CROSS JOIN", "join types SQL"],
          concepts: [
            {
              title: "RIGHT JOIN is LEFT JOIN backwards",
              body: "`A RIGHT JOIN B` keeps every row of B. It's exactly `B LEFT JOIN A` with the tables swapped, which is why most teams standardise on LEFT — one direction is easier to hold in your head.",
            },
            {
              title: "FULL OUTER JOIN keeps everything",
              body: "Unmatched rows from *both* sides survive, padded with NULLs. It's the right tool for reconciliation: \"what's in the ledger but not the bank statement, and vice versa\".",
              example: {
                sql: "SELECT h.name, g.name AS guild\nFROM heroes h\nFULL OUTER JOIN guilds g ON h.guild_id = g.id;",
              },
            },
            {
              title: "CROSS JOIN multiplies",
              body: "Every row of A paired with every row of B. 18 heroes × 5 guilds = 90 rows. Occasionally you want that (generating a calendar grid); usually seeing it means you forgot an `ON` clause.",
              tone: "warning",
            },
          ],
          challenges: [
            {
              id: "j-ot-1",
              type: "query",
              prompt:
                "Return every **guild** name as `guild` alongside each member's `name` — including guilds that currently have no members. Sort by guild then name.",
              solution:
                "SELECT g.name AS guild, h.name FROM guilds g LEFT JOIN heroes h ON h.guild_id = g.id ORDER BY g.name, h.name;",
              difficulty: "medium",
            },
            {
              id: "j-ot-2",
              type: "query",
              prompt:
                "Using a **FULL OUTER JOIN**, list every hero `name` and every guild `name` as `guild`, keeping unmatched rows from both sides. Sort by guild NULLS LAST, then name NULLS LAST.",
              solution:
                "SELECT h.name, g.name AS guild FROM heroes h FULL OUTER JOIN guilds g ON h.guild_id = g.id ORDER BY g.name NULLS LAST, h.name NULLS LAST;",
              grading: { mustUse: [{ pattern: "\\bfull\\s+(outer\\s+)?join\\b", label: "a `FULL OUTER JOIN`" }] },
              difficulty: "hard",
            },
            {
              id: "j-ot-3",
              type: "predict",
              prompt: "18 heroes, 5 guilds. How many rows?",
              query: "SELECT * FROM heroes CROSS JOIN guilds;",
              options: [
                { id: "a", label: "23" },
                { id: "b", label: "18" },
                { id: "c", label: "90" },
                { id: "d", label: "5" },
              ],
              correct: ["c"],
              explanation:
                "A cross join is the Cartesian product: 18 × 5 = 90. If a query you expected to return hundreds returns millions, look for a missing join condition.",
              difficulty: "medium",
            },
            {
              id: "j-ot-4",
              type: "choice",
              prompt:
                "You need every row from both tables, matched where possible. Which join?",
              options: [
                { id: "a", label: "INNER JOIN", code: true },
                { id: "b", label: "LEFT JOIN", code: true },
                { id: "c", label: "FULL OUTER JOIN", code: true },
                { id: "d", label: "CROSS JOIN", code: true },
              ],
              correct: ["c"],
              difficulty: "easy",
            },
            {
              id: "j-ot-5",
              type: "order",
              prompt: "Order these join types from **fewest** rows returned to **most**, for the same two tables.",
              items: ["INNER JOIN", "LEFT JOIN", "FULL OUTER JOIN", "CROSS JOIN"],
              explanation:
                "Inner keeps only matches; left adds unmatched left rows; full adds unmatched rows from both; cross ignores matching entirely and multiplies.",
              difficulty: "medium",
            },
          ],
        },
      ],
    },

    {
      id: "j-u2",
      slug: "advanced-joining",
      title: "Advanced Joining",
      description: "Three tables, self-joins, and keeping your row counts honest.",
      accent: "indigo",
      lessons: [
        {
          id: "j-multi",
          slug: "multi-table-joins",
          title: "Joining three or more tables",
          subtitle: "Follow the keys across the schema",
          objective: "Chain joins through a junction table",
          difficulty: "hard",
          estimatedMinutes: 11,
          datasetId: "guild",
          requires: ["j-outer"],
          keywords: ["multiple joins SQL", "join three tables", "junction table query"],
          concepts: [
            {
              title: "Joins chain left to right",
              body: "Each `JOIN` adds one table to the growing result. To get from heroes to quests you pass through `quest_log`, because that's where the two keys meet.",
              example: {
                sql: "SELECT h.name, q.title, ql.status\nFROM heroes h\nJOIN quest_log ql ON ql.hero_id = h.id\nJOIN quests q     ON q.id = ql.quest_id;",
              },
            },
            {
              title: "Watch the grain",
              body: "After joining `quest_log`, one hero produces one row *per attempt*. That's fine — until you also join something else one-to-many and accidentally multiply. Always know what one row of your result represents.",
              tone: "warning",
            },
          ],
          challenges: [
            {
              id: "j-mt-1",
              type: "query",
              prompt:
                "Return hero `name`, quest `title` and `status` for every quest attempt. Sort by hero name then quest title.",
              solution:
                "SELECT h.name, q.title, ql.status FROM heroes h JOIN quest_log ql ON ql.hero_id = h.id JOIN quests q ON q.id = ql.quest_id ORDER BY h.name, q.title;",
              difficulty: "medium",
            },
            {
              id: "j-mt-2",
              type: "query",
              prompt:
                "Return hero `name`, their guild's name as `guild`, and the quest `title` — for **completed** quests only. Sort by guild, then hero name, then title.",
              solution:
                "SELECT h.name, g.name AS guild, q.title FROM heroes h JOIN guilds g ON h.guild_id = g.id JOIN quest_log ql ON ql.hero_id = h.id JOIN quests q ON q.id = ql.quest_id WHERE ql.status = 'completed' ORDER BY g.name, h.name, q.title;",
              hints: ["Four tables: heroes, guilds, quest_log, quests."],
              difficulty: "hard",
            },
            {
              id: "j-mt-3",
              type: "query",
              prompt:
                "Which heroes attempted a **Legendary** quest? Return distinct hero `name`, sorted.",
              solution:
                "SELECT DISTINCT h.name FROM heroes h JOIN quest_log ql ON ql.hero_id = h.id JOIN quests q ON q.id = ql.quest_id WHERE q.difficulty = 'Legendary' ORDER BY h.name;",
              hints: ["A hero could attempt more than one — `DISTINCT` keeps it to one row each."],
              difficulty: "hard",
            },
            {
              id: "j-mt-4",
              type: "query",
              prompt:
                "Return quest `title`, `reward_gold`, and the `name` of each hero who **failed** it. Sort by title then name.",
              solution:
                "SELECT q.title, q.reward_gold, h.name FROM quests q JOIN quest_log ql ON ql.quest_id = q.id JOIN heroes h ON h.id = ql.hero_id WHERE ql.status = 'failed' ORDER BY q.title, h.name;",
              difficulty: "medium",
            },
            {
              id: "j-mt-5",
              type: "query",
              prompt:
                "Return every hero's `name` and the `title` of any quest they attempted — **including heroes who never attempted one** (title NULL). Sort by name then title NULLS FIRST.",
              solution:
                "SELECT h.name, q.title FROM heroes h LEFT JOIN quest_log ql ON ql.hero_id = h.id LEFT JOIN quests q ON q.id = ql.quest_id ORDER BY h.name, q.title NULLS FIRST;",
              hints: [
                "Both joins must be LEFT — an inner join anywhere downstream re-drops the rows.",
              ],
              explanation:
                "Once you start a LEFT JOIN chain, every subsequent join to that branch must also be LEFT, or you undo the whole thing.",
              difficulty: "expert",
            },
          ],
        },
        {
          id: "j-self",
          slug: "self-joins",
          title: "Self-joins",
          subtitle: "Comparing rows inside one table",
          objective: "Join a table to itself to relate rows",
          difficulty: "hard",
          estimatedMinutes: 10,
          datasetId: "org",
          requires: ["j-multi"],
          keywords: ["self join SQL", "employee manager query", "hierarchy SQL"],
          concepts: [
            {
              title: "Two aliases, one table",
              body: "`employees.manager_id` points at `employees.id`. Alias the table twice and it behaves like two different tables — one playing the employee, one playing the manager.",
              example: {
                sql: "SELECT e.name AS employee, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.id;",
              },
            },
            {
              title: "Use LEFT for the root",
              body: "The CEO has `manager_id IS NULL`. An inner self-join silently drops them — almost never what you want when drawing an org chart.",
              tone: "warning",
            },
            {
              title: "Self-joins also compare peers",
              body: "Join a table to itself on a shared attribute with `a.id < b.id` to generate unique pairs — useful for finding duplicates or colleagues in the same department.",
              tone: "tip",
            },
          ],
          challenges: [
            {
              id: "j-sf-1",
              type: "query",
              prompt:
                "Return each employee's `name` as `employee` and their manager's name as `manager`. Include the CEO (manager NULL). Sort by employee.",
              solution:
                "SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id ORDER BY e.name;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "j-sf-2",
              type: "query",
              prompt:
                "Return `employee` and `manager` names for everyone who **earns more than their manager**. Sort by employee.",
              solution:
                "SELECT e.name AS employee, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id WHERE e.salary > m.salary ORDER BY e.name;",
              grading: { checkColumnNames: true },
              hints: ["Compare `e.salary` with `m.salary` in the WHERE clause."],
              difficulty: "hard",
            },
            {
              id: "j-sf-3",
              type: "query",
              prompt:
                "Return the `name` of every employee who **manages at least one person**, sorted alphabetically, with no duplicates.",
              solution:
                "SELECT DISTINCT m.name FROM employees m JOIN employees e ON e.manager_id = m.id ORDER BY m.name;",
              difficulty: "hard",
            },
            {
              id: "j-sf-4",
              type: "query",
              prompt:
                "Return pairs of colleagues in the **same department**: `employee_a` and `employee_b`, each pair only once, no self-pairing. Sort by both columns.",
              solution:
                "SELECT a.name AS employee_a, b.name AS employee_b FROM employees a JOIN employees b ON a.dept_id = b.dept_id AND a.id < b.id ORDER BY a.name, b.name;",
              grading: { checkColumnNames: true },
              hints: [
                "Join on `dept_id`.",
                "`a.id < b.id` both removes self-pairs and stops (X,Y)/(Y,X) duplicates.",
              ],
              explanation:
                "The `<` trick is the standard way to generate unordered pairs. Using `<>` instead gives you every pair twice.",
              difficulty: "expert",
            },
            {
              id: "j-sf-5",
              type: "predict",
              prompt: "22 employees, exactly 1 with a NULL manager_id. Rows returned?",
              query:
                "SELECT e.name, m.name\nFROM employees e\nJOIN employees m ON e.manager_id = m.id;",
              options: [
                { id: "a", label: "22" },
                { id: "b", label: "21" },
                { id: "c", label: "484" },
                { id: "d", label: "1" },
              ],
              correct: ["b"],
              explanation:
                "The CEO's NULL `manager_id` matches nothing, so an inner join loses exactly that one row.",
              difficulty: "medium",
            },
          ],
        },
        {
          id: "j-boss",
          slug: "joins-checkpoint",
          title: "Checkpoint: The Cartographer",
          subtitle: "Navigate the whole schema",
          objective: "Apply every join type to a multi-table question",
          difficulty: "hard",
          estimatedMinutes: 14,
          datasetId: "guild",
          kind: "boss",
          requires: ["j-self"],
          keywords: ["SQL join practice", "join exercises"],
          concepts: [
            {
              title: "Read the question, then the schema",
              body: "Every one of these needs you to decide *which* table is the preserved side before you write a line. Open the Schema tab whenever you need it.",
            },
          ],
          challenges: [
            {
              id: "j-bs-1",
              type: "query",
              prompt:
                "Return guild `name` as `guild` and hero `name` for all members of guilds in cities whose name starts with **`D`** or **`E`**. Sort by guild then hero name.",
              solution:
                "SELECT g.name AS guild, h.name FROM guilds g JOIN heroes h ON h.guild_id = g.id WHERE g.city LIKE 'D%' OR g.city LIKE 'E%' ORDER BY g.name, h.name;",
              difficulty: "medium",
            },
            {
              id: "j-bs-2",
              type: "query",
              prompt:
                "Which heroes have **never completed** a quest? Return `name`, sorted. (A hero with only failed or abandoned attempts still counts as never completing one.)",
              solution:
                "SELECT h.name FROM heroes h LEFT JOIN quest_log ql ON ql.hero_id = h.id AND ql.status = 'completed' WHERE ql.id IS NULL ORDER BY h.name;",
              hints: [
                "The `status = 'completed'` test must live in the `ON` clause.",
                "Then keep the rows where nothing matched.",
              ],
              explanation:
                "Putting the status filter in `WHERE` would drop the very rows you're looking for. Conditions on the optional side belong in `ON`.",
              difficulty: "expert",
            },
            {
              id: "j-bs-3",
              type: "query",
              prompt:
                "Return quest `title` and hero `name` for attempts where the hero's `level` is **below** the quest's `min_level`. Sort by title then name.",
              solution:
                "SELECT q.title, h.name FROM quest_log ql JOIN quests q ON q.id = ql.quest_id JOIN heroes h ON h.id = ql.hero_id WHERE h.level < q.min_level ORDER BY q.title, h.name;",
              difficulty: "hard",
            },
            {
              id: "j-bs-4",
              type: "query",
              prompt:
                "Return every guild's `name` as `guild` plus the `city`, and the `name` of any hero of class **Mage** in it — guilds with no Mage should still appear with NULL. Sort by guild.",
              solution:
                "SELECT g.name AS guild, g.city, h.name FROM guilds g LEFT JOIN heroes h ON h.guild_id = g.id AND h.class = 'Mage' ORDER BY g.name, h.name;",
              difficulty: "expert",
            },
            {
              id: "j-bs-5",
              type: "query",
              prompt:
                "List distinct `region` values from `quests` that have **at least one completed attempt**, alphabetically.",
              solution:
                "SELECT DISTINCT q.region FROM quests q JOIN quest_log ql ON ql.quest_id = q.id WHERE ql.status = 'completed' ORDER BY q.region;",
              difficulty: "medium",
            },
          ],
        },
      ],
    },
  ],
};
