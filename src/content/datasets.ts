import type { Dataset } from "./types";

/**
 * Seed scripts for the in-browser Postgres instance.
 *
 * Rules for authoring a dataset:
 *  - Deterministic. No random(), no now() in stored values — grading compares
 *    the learner's rows against the reference solution's rows, and both must be
 *    reproducible across resets.
 *  - Small. Every row is re-inserted whenever a DML challenge resets state,
 *    so keep tables in the tens-to-hundreds, not thousands (except `warehouse`,
 *    which is generated and exists precisely to be big).
 *  - Self-documenting. Column names should read like English in a query.
 */

/* ========================================================== 1. realm ===== */

const realm: Dataset = {
  id: "realm",
  title: "The Realm",
  description:
    "A single table of adventurers. Everything you need to practise SELECT, WHERE, ORDER BY and LIMIT.",
  tables: [{ name: "heroes", description: "One row per adventurer in the realm." }],
  sql: `
DROP TABLE IF EXISTS heroes CASCADE;

CREATE TABLE heroes (
  id          integer PRIMARY KEY,
  name        text        NOT NULL,
  class       text        NOT NULL,
  level       integer     NOT NULL,
  hp          integer     NOT NULL,
  gold        numeric(10,2) NOT NULL,
  home_realm  text,
  joined_on   date        NOT NULL,
  is_active   boolean     NOT NULL
);

INSERT INTO heroes (id, name, class, level, hp, gold, home_realm, joined_on, is_active) VALUES
  (1,  'Ayla Stormcrest',   'Mage',    42, 310,  8420.50, 'Northwind',  '2021-03-14', true),
  (2,  'Bram Ironfoot',     'Warrior', 51, 980,  3120.00, 'Stonehollow','2020-11-02', true),
  (3,  'Cass Nightwhisper', 'Rogue',   38, 420,  9955.75, 'Duskvale',   '2022-01-27', true),
  (4,  'Doran Vale',        'Cleric',  47, 640,  2410.25, 'Northwind',  '2021-07-19', true),
  (5,  'Elara Sunfire',     'Mage',    55, 380, 12750.00, 'Emberreach', '2019-05-30', true),
  (6,  'Fenn Quickblade',   'Rogue',   29, 350,  1875.40, 'Duskvale',   '2023-02-11', true),
  (7,  'Gilda Ashborne',    'Warrior', 61, 1150, 6640.00, 'Emberreach', '2018-09-08', false),
  (8,  'Hale Rivenwood',    'Ranger',  33, 500,  2280.60, 'Greenmarch', '2022-06-05', true),
  (9,  'Iona Frostmere',    'Cleric',  44, 610,  4390.00, 'Northwind',  '2021-12-23', false),
  (10, 'Jax Thornfield',    'Warrior', 27, 720,   940.10, 'Stonehollow','2023-08-17', true),
  (11, 'Kira Emberlyn',     'Mage',    36, 290,  5510.90, 'Emberreach', '2022-04-02', true),
  (12, 'Lorne Blackwater',  'Rogue',   49, 460, 15220.00, 'Duskvale',   '2020-02-14', true),
  (13, 'Mira Dawnbrook',    'Ranger',  52, 540,  7130.35, 'Greenmarch', '2019-10-21', true),
  (14, 'Nox Vellum',        'Warlock', 58, 400, 11040.00, NULL,         '2019-01-09', true),
  (15, 'Odessa Pyre',       'Warlock', 45, 370,  8890.00, 'Emberreach', '2021-05-16', false),
  (16, 'Pell Marrow',       'Cleric',  22, 480,   620.00, 'Greenmarch', '2024-01-30', true),
  (17, 'Quill Sablewind',   'Rogue',   40, 410,  6015.20, NULL,         '2021-09-12', true),
  (18, 'Rhea Goldhand',     'Warrior', 35, 830,  3480.00, 'Stonehollow','2022-11-25', true),
  (19, 'Soren Halewick',    'Ranger',  48, 560,  5275.80, 'Greenmarch', '2020-07-04', true),
  (20, 'Tamsin Veil',       'Mage',    31, 300,  2960.00, 'Northwind',  '2023-05-19', true),
  (21, 'Ulric Stonebrand',  'Warrior', 66, 1290, 9410.00, 'Stonehollow','2017-12-01', false),
  (22, 'Vera Lightfall',    'Cleric',  53, 680,  7745.65, 'Northwind',  '2019-08-27', true),
  (23, 'Wren Ashvale',      'Ranger',  25, 470,  1130.00, 'Duskvale',   '2024-03-08', true),
  (24, 'Xander Grim',       'Warlock', 39, 360,  4880.45, 'Emberreach', '2022-08-14', true);
`,
};

/* ========================================================== 2. guild ===== */

const guild: Dataset = {
  id: "guild",
  title: "Guild Hall",
  description:
    "Heroes belong to guilds and take on quests. Four related tables — the natural home for JOINs and GROUP BY.",
  tables: [
    { name: "guilds", description: "Adventuring guilds, each with a home city." },
    { name: "heroes", description: "Adventurers, optionally belonging to a guild." },
    { name: "quests", description: "Contracts available to take on, with a reward." },
    { name: "quest_log", description: "Which hero attempted which quest, and how it went." },
  ],
  sql: `
DROP TABLE IF EXISTS quest_log CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS heroes CASCADE;
DROP TABLE IF EXISTS guilds CASCADE;

CREATE TABLE guilds (
  id          integer PRIMARY KEY,
  name        text NOT NULL UNIQUE,
  city        text NOT NULL,
  founded_on  date NOT NULL,
  reputation  integer NOT NULL
);

CREATE TABLE heroes (
  id        integer PRIMARY KEY,
  name      text NOT NULL,
  class     text NOT NULL,
  level     integer NOT NULL,
  guild_id  integer REFERENCES guilds(id),
  joined_on date NOT NULL
);

CREATE TABLE quests (
  id          integer PRIMARY KEY,
  title       text NOT NULL,
  difficulty  text NOT NULL,
  reward_gold numeric(10,2) NOT NULL,
  min_level   integer NOT NULL,
  region      text NOT NULL
);

CREATE TABLE quest_log (
  id           integer PRIMARY KEY,
  hero_id      integer NOT NULL REFERENCES heroes(id),
  quest_id     integer NOT NULL REFERENCES quests(id),
  status       text NOT NULL,
  attempted_on date NOT NULL,
  gold_earned  numeric(10,2)
);

INSERT INTO guilds (id, name, city, founded_on, reputation) VALUES
  (1, 'The Silver Compass', 'Northwind',   '2015-04-02', 880),
  (2, 'Emberhand',          'Emberreach',  '2012-09-18', 940),
  (3, 'Duskrunners',        'Duskvale',    '2018-01-11', 610),
  (4, 'The Green Pact',     'Greenmarch',  '2016-06-25', 725),
  (5, 'Stone Vigil',        'Stonehollow', '2010-03-07', 990);

INSERT INTO heroes (id, name, class, level, guild_id, joined_on) VALUES
  (1,  'Ayla Stormcrest',   'Mage',    42, 1,    '2021-03-14'),
  (2,  'Bram Ironfoot',     'Warrior', 51, 5,    '2020-11-02'),
  (3,  'Cass Nightwhisper', 'Rogue',   38, 3,    '2022-01-27'),
  (4,  'Doran Vale',        'Cleric',  47, 1,    '2021-07-19'),
  (5,  'Elara Sunfire',     'Mage',    55, 2,    '2019-05-30'),
  (6,  'Fenn Quickblade',   'Rogue',   29, 3,    '2023-02-11'),
  (7,  'Gilda Ashborne',    'Warrior', 61, 2,    '2018-09-08'),
  (8,  'Hale Rivenwood',    'Ranger',  33, 4,    '2022-06-05'),
  (9,  'Iona Frostmere',    'Cleric',  44, 1,    '2021-12-23'),
  (10, 'Jax Thornfield',    'Warrior', 27, 5,    '2023-08-17'),
  (11, 'Kira Emberlyn',     'Mage',    36, 2,    '2022-04-02'),
  (12, 'Lorne Blackwater',  'Rogue',   49, 3,    '2020-02-14'),
  (13, 'Mira Dawnbrook',    'Ranger',  52, 4,    '2019-10-21'),
  (14, 'Nox Vellum',        'Warlock', 58, NULL, '2019-01-09'),
  (15, 'Odessa Pyre',       'Warlock', 45, 2,    '2021-05-16'),
  (16, 'Pell Marrow',       'Cleric',  22, 4,    '2024-01-30'),
  (17, 'Quill Sablewind',   'Rogue',   40, NULL, '2021-09-12'),
  (18, 'Rhea Goldhand',     'Warrior', 35, 5,    '2022-11-25');

INSERT INTO quests (id, title, difficulty, reward_gold, min_level, region) VALUES
  (1,  'Clear the Rat Cellar',       'Trivial',   45.00,  1,  'Northwind'),
  (2,  'Escort the Salt Caravan',    'Easy',     180.00,  10, 'Stonehollow'),
  (3,  'Map the Sunken Library',     'Easy',     240.00,  15, 'Duskvale'),
  (4,  'Break the Frost Siege',      'Medium',   760.00,  30, 'Northwind'),
  (5,  'Silence the Ash Choir',      'Medium',   820.00,  32, 'Emberreach'),
  (6,  'Retrieve the Verdant Seal',  'Medium',   690.00,  28, 'Greenmarch'),
  (7,  'Slay the Bog Wyrm',          'Hard',    1900.00,  45, 'Greenmarch'),
  (8,  'Storm the Obsidian Spire',   'Hard',    2350.00,  48, 'Emberreach'),
  (9,  'Bind the Hollow King',       'Legendary',5400.00, 58, 'Duskvale'),
  (10, 'Rekindle the World Forge',   'Legendary',6100.00, 60, 'Stonehollow'),
  (11, 'Chart the Drowned Coast',    'Easy',     205.00,  12, 'Greenmarch'),
  (12, 'Hunt the Pale Stalker',      'Hard',    2100.00,  46, 'Northwind');

INSERT INTO quest_log (id, hero_id, quest_id, status, attempted_on, gold_earned) VALUES
  (1,  1,  4,  'completed', '2023-01-12',  760.00),
  (2,  1,  1,  'completed', '2022-05-03',   45.00),
  (3,  1,  8,  'failed',    '2023-06-21',    0.00),
  (4,  2,  10, 'completed', '2023-03-30', 6100.00),
  (5,  2,  2,  'completed', '2021-08-14',  180.00),
  (6,  2,  7,  'completed', '2023-09-02', 1900.00),
  (7,  3,  3,  'completed', '2022-07-08',  240.00),
  (8,  3,  9,  'abandoned', '2023-11-19',     NULL),
  (9,  4,  4,  'completed', '2023-02-02',  760.00),
  (10, 4,  12, 'failed',    '2023-08-25',    0.00),
  (11, 5,  8,  'completed', '2022-12-05', 2350.00),
  (12, 5,  5,  'completed', '2022-03-17',  820.00),
  (13, 5,  10, 'completed', '2023-07-11', 6100.00),
  (14, 6,  1,  'completed', '2023-04-09',   45.00),
  (15, 6,  3,  'failed',    '2023-10-02',    0.00),
  (16, 7,  9,  'completed', '2023-05-28', 5400.00),
  (17, 7,  7,  'completed', '2022-11-13', 1900.00),
  (18, 8,  6,  'completed', '2023-01-25',  690.00),
  (19, 8,  11, 'completed', '2022-09-30',  205.00),
  (20, 9,  4,  'abandoned', '2023-03-06',     NULL),
  (21, 10, 2,  'completed', '2024-01-15',  180.00),
  (22, 11, 5,  'completed', '2023-06-04',  820.00),
  (23, 12, 3,  'completed', '2021-05-22',  240.00),
  (24, 12, 9,  'failed',    '2023-12-01',    0.00),
  (25, 13, 7,  'completed', '2023-02-18', 1900.00),
  (26, 13, 6,  'completed', '2022-08-09',  690.00),
  (27, 14, 8,  'completed', '2023-04-27', 2350.00),
  (28, 15, 5,  'completed', '2022-10-16',  820.00),
  (29, 16, 1,  'completed', '2024-02-20',   45.00),
  (30, 17, 3,  'completed', '2022-02-11',  240.00),
  (31, 18, 2,  'failed',    '2023-07-30',    0.00),
  (32, 2,  4,  'completed', '2024-02-05',  760.00),
  (33, 5,  12, 'completed', '2024-01-08', 2100.00),
  (34, 7,  10, 'abandoned', '2024-03-12',     NULL);
`,
};

/* ========================================================= 3. market ===== */

const market: Dataset = {
  id: "market",
  title: "Night Market",
  description:
    "A miniature e-commerce schema: customers, orders, line items and a product catalogue. Built for realistic analytics questions.",
  tables: [
    { name: "categories", description: "Product categories." },
    { name: "products", description: "Catalogue items with price and stock." },
    { name: "customers", description: "Buyers, with signup date, country and tier." },
    { name: "orders", description: "One row per order, with status and placed_at." },
    { name: "order_items", description: "Line items: which product, how many, at what price." },
  ],
  sql: `
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE categories (
  id   integer PRIMARY KEY,
  name text NOT NULL UNIQUE
);

CREATE TABLE products (
  id          integer PRIMARY KEY,
  name        text NOT NULL,
  category_id integer REFERENCES categories(id),
  price       numeric(10,2) NOT NULL,
  cost        numeric(10,2) NOT NULL,
  stock       integer NOT NULL,
  discontinued boolean NOT NULL DEFAULT false
);

CREATE TABLE customers (
  id        integer PRIMARY KEY,
  name      text NOT NULL,
  email     text NOT NULL UNIQUE,
  country   text NOT NULL,
  tier      text NOT NULL,
  signed_up date NOT NULL
);

CREATE TABLE orders (
  id          integer PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customers(id),
  status      text NOT NULL,
  placed_at   timestamp NOT NULL,
  shipped_at  timestamp,
  channel     text NOT NULL
);

CREATE TABLE order_items (
  id         integer PRIMARY KEY,
  order_id   integer NOT NULL REFERENCES orders(id),
  product_id integer NOT NULL REFERENCES products(id),
  quantity   integer NOT NULL,
  unit_price numeric(10,2) NOT NULL
);

INSERT INTO categories (id, name) VALUES
  (1, 'Lanterns'), (2, 'Charms'), (3, 'Brews'), (4, 'Maps'), (5, 'Instruments');

INSERT INTO products (id, name, category_id, price, cost, stock, discontinued) VALUES
  (1,  'Everflame Lantern',    1, 129.00,  54.00,  38, false),
  (2,  'Pocket Moonlamp',      1,  42.50,  17.20, 210, false),
  (3,  'Drowned Beacon',       1,  88.00,  40.00,   0, true),
  (4,  'Warding Charm',        2,  24.99,   6.10, 460, false),
  (5,  'Luckstone Pendant',    2,  76.00,  28.00,  95, false),
  (6,  'Silence Sigil',        2, 199.00,  70.00,  12, false),
  (7,  'Nightcap Tonic',       3,  18.75,   5.40, 320, false),
  (8,  'Ironblood Draught',    3,  64.00,  22.00,  74, false),
  (9,  'Dreamless Elixir',     3, 145.00,  61.00,   9, false),
  (10, 'Tidewalker Brew',      3,  31.00,  12.50,   0, true),
  (11, 'Chart of the Deep',    4, 210.00,  85.00,  27, false),
  (12, 'Skyroad Atlas',        4,  95.50,  38.00, 140, false),
  (13, 'Hollow Kingdom Map',   4, 340.00, 130.00,   4, false),
  (14, 'Bone Flute',           5,  58.00,  19.00,  66, false),
  (15, 'Stormharp',            5, 480.00, 205.00,   3, false),
  (16, 'Wandering Fiddle',     5, 155.00,  67.00,  41, false);

INSERT INTO customers (id, name, email, country, tier, signed_up) VALUES
  (1,  'Nadia Reyes',    'nadia@example.com',   'Spain',      'gold',     '2021-02-11'),
  (2,  'Tomas Lindqvist','tomas@example.com',   'Sweden',     'silver',   '2021-06-30'),
  (3,  'Amara Okonkwo',  'amara@example.com',   'Nigeria',    'gold',     '2020-11-05'),
  (4,  'Jun Watanabe',   'jun@example.com',     'Japan',      'platinum', '2019-08-19'),
  (5,  'Priya Raghavan', 'priya@example.com',   'India',      'silver',   '2022-01-24'),
  (6,  'Marcus Hale',    'marcus@example.com',  'Canada',     'bronze',   '2023-03-02'),
  (7,  'Lea Fontaine',   'lea@example.com',     'France',     'gold',     '2020-05-14'),
  (8,  'Diego Ferreira', 'diego@example.com',   'Brazil',     'silver',   '2022-09-08'),
  (9,  'Sofia Marchetti','sofia@example.com',   'Italy',      'bronze',   '2023-07-21'),
  (10, 'Owen Blackwood', 'owen@example.com',    'Ireland',    'platinum', '2018-12-03'),
  (11, 'Hana Kovac',     'hana@example.com',    'Croatia',    'bronze',   '2024-01-17'),
  (12, 'Yusuf Demir',    'yusuf@example.com',   'Turkey',     'silver',   '2021-10-26');

INSERT INTO orders (id, customer_id, status, placed_at, shipped_at, channel) VALUES
  (1001, 1,  'delivered', '2024-01-08 09:15:00', '2024-01-09 11:00:00', 'web'),
  (1002, 4,  'delivered', '2024-01-11 14:40:00', '2024-01-12 08:30:00', 'web'),
  (1003, 2,  'delivered', '2024-01-15 18:05:00', '2024-01-18 09:45:00', 'mobile'),
  (1004, 7,  'cancelled', '2024-01-19 10:22:00', NULL,                  'web'),
  (1005, 3,  'delivered', '2024-02-02 08:00:00', '2024-02-03 16:10:00', 'mobile'),
  (1006, 10, 'delivered', '2024-02-06 21:30:00', '2024-02-08 07:20:00', 'web'),
  (1007, 5,  'shipped',   '2024-02-14 12:12:00', '2024-02-15 10:00:00', 'mobile'),
  (1008, 1,  'delivered', '2024-02-20 16:45:00', '2024-02-22 09:05:00', 'web'),
  (1009, 8,  'pending',   '2024-03-01 07:55:00', NULL,                  'partner'),
  (1010, 4,  'delivered', '2024-03-04 19:20:00', '2024-03-05 12:40:00', 'web'),
  (1011, 6,  'delivered', '2024-03-09 11:35:00', '2024-03-12 14:15:00', 'mobile'),
  (1012, 9,  'cancelled', '2024-03-14 15:50:00', NULL,                  'web'),
  (1013, 10, 'delivered', '2024-03-18 09:05:00', '2024-03-19 17:30:00', 'partner'),
  (1014, 12, 'shipped',   '2024-03-23 13:25:00', '2024-03-25 08:00:00', 'web'),
  (1015, 3,  'delivered', '2024-04-01 10:10:00', '2024-04-02 11:50:00', 'mobile'),
  (1016, 7,  'delivered', '2024-04-05 17:00:00', '2024-04-07 09:30:00', 'web'),
  (1017, 11, 'pending',   '2024-04-11 20:45:00', NULL,                  'mobile'),
  (1018, 4,  'delivered', '2024-04-16 08:35:00', '2024-04-17 13:20:00', 'web'),
  (1019, 2,  'delivered', '2024-04-22 14:55:00', '2024-04-24 10:05:00', 'web'),
  (1020, 5,  'delivered', '2024-04-28 12:00:00', '2024-04-30 15:45:00', 'partner');

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
  (1,  1001, 2,  2, 42.50),  (2,  1001, 4,  1, 24.99),
  (3,  1002, 15, 1, 480.00), (4,  1002, 14, 2, 58.00),
  (5,  1003, 7,  4, 18.75),  (6,  1003, 8,  1, 64.00),
  (7,  1004, 11, 1, 210.00),
  (8,  1005, 1,  1, 129.00), (9,  1005, 5,  2, 76.00),  (10, 1005, 12, 1, 95.50),
  (11, 1006, 13, 1, 340.00), (12, 1006, 6,  1, 199.00),
  (13, 1007, 4,  6, 24.99),
  (14, 1008, 9,  1, 145.00), (15, 1008, 7,  2, 18.75),
  (16, 1009, 16, 1, 155.00),
  (17, 1010, 15, 1, 480.00), (18, 1010, 11, 1, 210.00), (19, 1010, 2, 3, 42.50),
  (20, 1011, 4,  2, 24.99),  (21, 1011, 7,  1, 18.75),
  (22, 1012, 1,  1, 129.00),
  (23, 1013, 13, 1, 340.00), (24, 1013, 12, 2, 95.50),
  (25, 1014, 8,  3, 64.00),
  (26, 1015, 5,  1, 76.00),  (27, 1015, 6,  1, 199.00), (28, 1015, 16, 1, 155.00),
  (29, 1016, 1,  2, 129.00), (30, 1016, 14, 1, 58.00),
  (31, 1017, 2,  1, 42.50),
  (32, 1018, 9,  2, 145.00), (33, 1018, 15, 1, 480.00),
  (34, 1019, 12, 1, 95.50),  (35, 1019, 4,  4, 24.99),
  (36, 1020, 11, 1, 210.00), (37, 1020, 8,  2, 64.00),  (38, 1020, 7, 3, 18.75);
`,
};

/* ====================================================== 4. telemetry ===== */

const telemetry: Dataset = {
  id: "telemetry",
  title: "Telemetry",
  description:
    "Event-stream data with users, sessions and timestamped events — the natural playground for window functions, funnels and retention.",
  tables: [
    { name: "app_users", description: "Accounts with a signup date and plan." },
    { name: "sessions", description: "One row per app session, with device and duration." },
    { name: "events", description: "Timestamped, named events belonging to a session." },
  ],
  sql: `
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;

CREATE TABLE app_users (
  id        integer PRIMARY KEY,
  handle    text NOT NULL UNIQUE,
  plan      text NOT NULL,
  country   text NOT NULL,
  signed_up date NOT NULL
);

CREATE TABLE sessions (
  id          integer PRIMARY KEY,
  user_id     integer NOT NULL REFERENCES app_users(id),
  started_at  timestamp NOT NULL,
  duration_s  integer NOT NULL,
  device      text NOT NULL
);

CREATE TABLE events (
  id          integer PRIMARY KEY,
  session_id  integer NOT NULL REFERENCES sessions(id),
  name        text NOT NULL,
  occurred_at timestamp NOT NULL,
  value       numeric(10,2)
);

INSERT INTO app_users (id, handle, plan, country, signed_up) VALUES
  (1, 'quietfox',   'pro',   'US', '2024-01-03'),
  (2, 'mossbank',   'free',  'DE', '2024-01-09'),
  (3, 'lanterna',   'pro',   'ES', '2024-01-14'),
  (4, 'tidewalker', 'team',  'JP', '2024-01-21'),
  (5, 'ashgrove',   'free',  'BR', '2024-02-02'),
  (6, 'northlight', 'pro',   'SE', '2024-02-08'),
  (7, 'saltmarsh',  'free',  'IE', '2024-02-17'),
  (8, 'emberwake',  'team',  'IN', '2024-02-25');

INSERT INTO sessions (id, user_id, started_at, duration_s, device) VALUES
  (1,  1, '2024-03-01 08:12:00',  840, 'desktop'),
  (2,  1, '2024-03-03 19:40:00',  310, 'mobile'),
  (3,  1, '2024-03-08 07:55:00', 1620, 'desktop'),
  (4,  2, '2024-03-02 12:05:00',  145, 'mobile'),
  (5,  2, '2024-03-09 21:30:00',  260, 'mobile'),
  (6,  3, '2024-03-01 14:20:00', 1180, 'desktop'),
  (7,  3, '2024-03-05 09:10:00',  960, 'tablet'),
  (8,  3, '2024-03-12 16:45:00', 2040, 'desktop'),
  (9,  4, '2024-03-04 03:25:00', 1450, 'desktop'),
  (10, 4, '2024-03-11 05:50:00', 1720, 'desktop'),
  (11, 5, '2024-03-06 18:15:00',   95, 'mobile'),
  (12, 6, '2024-03-02 10:00:00',  730, 'desktop'),
  (13, 6, '2024-03-07 11:35:00',  880, 'desktop'),
  (14, 6, '2024-03-14 08:05:00', 1265, 'mobile'),
  (15, 7, '2024-03-10 20:55:00',  210, 'tablet'),
  (16, 8, '2024-03-03 06:40:00', 1990, 'desktop'),
  (17, 8, '2024-03-09 07:20:00', 2310, 'desktop'),
  (18, 8, '2024-03-15 06:05:00', 1540, 'mobile');

INSERT INTO events (id, session_id, name, occurred_at, value) VALUES
  (1,  1,  'app_open',     '2024-03-01 08:12:00', NULL),
  (2,  1,  'query_run',    '2024-03-01 08:15:30', 120.00),
  (3,  1,  'query_run',    '2024-03-01 08:19:10', 340.00),
  (4,  1,  'lesson_done',  '2024-03-01 08:24:00', 30.00),
  (5,  2,  'app_open',     '2024-03-03 19:40:00', NULL),
  (6,  2,  'query_run',    '2024-03-03 19:43:20', 95.00),
  (7,  3,  'app_open',     '2024-03-08 07:55:00', NULL),
  (8,  3,  'query_run',    '2024-03-08 07:58:40', 210.00),
  (9,  3,  'lesson_done',  '2024-03-08 08:06:00', 45.00),
  (10, 3,  'upgrade_view', '2024-03-08 08:18:00', NULL),
  (11, 4,  'app_open',     '2024-03-02 12:05:00', NULL),
  (12, 4,  'query_run',    '2024-03-02 12:06:50', 410.00),
  (13, 5,  'app_open',     '2024-03-09 21:30:00', NULL),
  (14, 5,  'lesson_done',  '2024-03-09 21:33:10', 20.00),
  (15, 6,  'app_open',     '2024-03-01 14:20:00', NULL),
  (16, 6,  'query_run',    '2024-03-01 14:25:00', 180.00),
  (17, 6,  'query_run',    '2024-03-01 14:31:45', 150.00),
  (18, 6,  'lesson_done',  '2024-03-01 14:38:00', 40.00),
  (19, 7,  'app_open',     '2024-03-05 09:10:00', NULL),
  (20, 7,  'lesson_done',  '2024-03-05 09:22:00', 35.00),
  (21, 8,  'app_open',     '2024-03-12 16:45:00', NULL),
  (22, 8,  'query_run',    '2024-03-12 16:50:20', 275.00),
  (23, 8,  'upgrade_view', '2024-03-12 17:05:00', NULL),
  (24, 8,  'upgrade_done', '2024-03-12 17:09:30', 12.00),
  (25, 9,  'app_open',     '2024-03-04 03:25:00', NULL),
  (26, 9,  'query_run',    '2024-03-04 03:31:00', 520.00),
  (27, 9,  'lesson_done',  '2024-03-04 03:44:00', 50.00),
  (28, 10, 'app_open',     '2024-03-11 05:50:00', NULL),
  (29, 10, 'query_run',    '2024-03-11 05:57:15', 305.00),
  (30, 10, 'lesson_done',  '2024-03-11 06:12:00', 55.00),
  (31, 11, 'app_open',     '2024-03-06 18:15:00', NULL),
  (32, 12, 'app_open',     '2024-03-02 10:00:00', NULL),
  (33, 12, 'query_run',    '2024-03-02 10:04:40', 165.00),
  (34, 13, 'app_open',     '2024-03-07 11:35:00', NULL),
  (35, 13, 'lesson_done',  '2024-03-07 11:47:00', 30.00),
  (36, 14, 'app_open',     '2024-03-14 08:05:00', NULL),
  (37, 14, 'query_run',    '2024-03-14 08:11:25', 240.00),
  (38, 14, 'upgrade_view', '2024-03-14 08:22:00', NULL),
  (39, 15, 'app_open',     '2024-03-10 20:55:00', NULL),
  (40, 16, 'app_open',     '2024-03-03 06:40:00', NULL),
  (41, 16, 'query_run',    '2024-03-03 06:48:00', 610.00),
  (42, 16, 'lesson_done',  '2024-03-03 07:02:00', 60.00),
  (43, 17, 'app_open',     '2024-03-09 07:20:00', NULL),
  (44, 17, 'query_run',    '2024-03-09 07:29:30', 480.00),
  (45, 17, 'query_run',    '2024-03-09 07:41:00', 390.00),
  (46, 18, 'app_open',     '2024-03-15 06:05:00', NULL),
  (47, 18, 'lesson_done',  '2024-03-15 06:19:00', 45.00),
  (48, 18, 'upgrade_view', '2024-03-15 06:26:00', NULL);
`,
};

/* =========================================================== 5. org ====== */

const org: Dataset = {
  id: "org",
  title: "Org Chart",
  description:
    "A self-referencing employee hierarchy. Purpose-built for recursive CTEs, self-joins and hierarchy walks.",
  tables: [
    { name: "departments", description: "Departments with a budget." },
    { name: "employees", description: "Employees; manager_id points at another employee." },
  ],
  sql: `
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

CREATE TABLE departments (
  id     integer PRIMARY KEY,
  name   text NOT NULL UNIQUE,
  budget numeric(12,2) NOT NULL
);

CREATE TABLE employees (
  id         integer PRIMARY KEY,
  name       text NOT NULL,
  title      text NOT NULL,
  dept_id    integer REFERENCES departments(id),
  manager_id integer REFERENCES employees(id),
  salary     numeric(10,2) NOT NULL,
  hired_on   date NOT NULL
);

INSERT INTO departments (id, name, budget) VALUES
  (1, 'Executive',   1200000.00),
  (2, 'Engineering', 4800000.00),
  (3, 'Design',      1100000.00),
  (4, 'Sales',       2600000.00),
  (5, 'Support',      900000.00);

INSERT INTO employees (id, name, title, dept_id, manager_id, salary, hired_on) VALUES
  (1,  'Imogen Vale',    'Chief Executive',      1, NULL, 320000.00, '2015-01-05'),
  (2,  'Rafael Ortiz',   'VP Engineering',       2, 1,    255000.00, '2016-03-14'),
  (3,  'Nour Haddad',    'VP Design',            3, 1,    212000.00, '2017-06-01'),
  (4,  'Grace Bellamy',  'VP Sales',             4, 1,    228000.00, '2016-09-19'),
  (5,  'Tobias Kern',    'Engineering Manager',  2, 2,    186000.00, '2018-02-12'),
  (6,  'Sana Iqbal',     'Engineering Manager',  2, 2,    191000.00, '2018-08-27'),
  (7,  'Milo Barros',    'Staff Engineer',       2, 5,    178000.00, '2019-01-08'),
  (8,  'Petra Lindgren', 'Senior Engineer',      2, 5,    154000.00, '2019-11-04'),
  (9,  'Kwame Mensah',   'Engineer',             2, 5,    128000.00, '2021-04-19'),
  (10, 'Yara Solis',     'Senior Engineer',      2, 6,    149000.00, '2020-02-24'),
  (11, 'Dev Chandra',    'Engineer',             2, 6,    121000.00, '2022-01-10'),
  (12, 'Elin Waverly',   'Junior Engineer',      2, 10,    94000.00, '2023-05-15'),
  (13, 'Otto Reinhart',  'Design Lead',          3, 3,    162000.00, '2018-10-01'),
  (14, 'Aiko Nakamura',  'Product Designer',     3, 13,   131000.00, '2020-07-13'),
  (15, 'Bea Fontaine',   'Product Designer',     3, 13,   127000.00, '2021-09-06'),
  (16, 'Lucas Moreau',   'Sales Director',       4, 4,    174000.00, '2017-11-20'),
  (17, 'Zara Osei',      'Account Executive',    4, 16,   118000.00, '2019-05-27'),
  (18, 'Finn Callahan',  'Account Executive',    4, 16,   112000.00, '2020-10-12'),
  (19, 'Rosa Vidal',     'Support Lead',         5, 1,    124000.00, '2018-04-30'),
  (20, 'Hugo Petrov',    'Support Engineer',     5, 19,    86000.00, '2022-03-21'),
  (21, 'Nina Achebe',    'Support Engineer',     5, 19,    89000.00, '2021-12-06'),
  (22, 'Theo Lindqvist', 'Junior Engineer',      2, 10,    91000.00, '2023-08-28');
`,
};

/* ===================================================== 6. warehouse ====== */

const warehouse: Dataset = {
  id: "warehouse",
  title: "Warehouse",
  description:
    "A generated table of 50,000 shipments. Big enough that indexes, EXPLAIN plans and query shape actually matter.",
  tables: [
    { name: "shipments", description: "50,000 synthetic shipment rows." },
    { name: "warehouses", description: "Twelve distribution centres." },
  ],
  sql: `
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;

CREATE TABLE warehouses (
  id      integer PRIMARY KEY,
  code    text NOT NULL UNIQUE,
  region  text NOT NULL
);

INSERT INTO warehouses (id, code, region)
SELECT g,
       'WH-' || lpad(g::text, 3, '0'),
       (ARRAY['north','south','east','west'])[1 + (g % 4)]
FROM generate_series(1, 12) AS g;

CREATE TABLE shipments (
  id           integer PRIMARY KEY,
  warehouse_id integer NOT NULL REFERENCES warehouses(id),
  carrier      text NOT NULL,
  status       text NOT NULL,
  weight_kg    numeric(8,2) NOT NULL,
  shipped_on   date NOT NULL,
  delivered_on date
);

-- Deterministic pseudo-random fill: values derive from the row number only,
-- so every learner (and the grader) sees exactly the same 50,000 rows.
INSERT INTO shipments (id, warehouse_id, carrier, status, weight_kg, shipped_on, delivered_on)
SELECT
  g,
  1 + (g * 7 % 12),
  (ARRAY['Aurora Freight','Beacon Post','Cinder Express','Dawnline'])[1 + (g * 3 % 4)],
  (ARRAY['delivered','delivered','delivered','in_transit','lost'])[1 + (g * 11 % 5)],
  round((5 + (g * 13 % 4000) / 100.0)::numeric, 2),
  DATE '2023-01-01' + ((g * 17) % 730),
  CASE WHEN (g * 11 % 5) < 3
       THEN DATE '2023-01-01' + ((g * 17) % 730) + (1 + (g % 9))
       ELSE NULL END
FROM generate_series(1, 50000) AS g;

ANALYZE shipments;
`,
};

/* ========================================================== registry ===== */

export const datasets: Dataset[] = [realm, guild, market, telemetry, org, warehouse];

const byId = new Map(datasets.map((d) => [d.id, d]));

export function getDataset(id: string): Dataset {
  const d = byId.get(id);
  if (!d) throw new Error(`Unknown dataset: ${id}`);
  return d;
}

export function tryGetDataset(id: string): Dataset | undefined {
  return byId.get(id);
}
