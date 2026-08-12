export interface Faq {
  question: string;
  answer: string;
  category?: string;
}

/** Shown on the homepage and emitted as FAQPage structured data. */
export const HOME_FAQS: Faq[] = [
  {
    question: "Is SQLQuest really free?",
    answer:
      "Yes — completely, with no paid tier and no ads. It's open source under the MIT licence, so you can also run your own copy. The gems you earn are an in-app currency for heart refills and streak freezes; there's nothing to buy with money.",
  },
  {
    question: "Do I need to install a database?",
    answer:
      "No. SQLQuest compiles PostgreSQL to WebAssembly and runs it inside your browser tab. There's nothing to install, nothing to configure, and your queries never travel over the network.",
  },
  {
    question: "Which SQL dialect does it teach?",
    answer:
      "PostgreSQL, because that's what's running. The overwhelming majority of what you learn — SELECT, joins, aggregation, window functions, CTEs — is standard SQL that transfers directly to MySQL, SQL Server, BigQuery and Snowflake. Where Postgres differs, the lesson says so.",
  },
  {
    question: "Do I need an account?",
    answer:
      "Not to learn. Progress is saved in your browser automatically. An account only adds cross-device sync, a public profile and the leaderboard — and you can create one later without losing anything you've already done.",
  },
  {
    question: "I've never written code before. Is this too advanced?",
    answer:
      "The Foundations track assumes nothing at all — the first lesson is literally 'what is a SELECT'. SQL is also an unusually good first language, because you describe what you want rather than how to compute it.",
  },
  {
    question: "How long does it take to finish?",
    answer:
      "About 8 hours of focused work across all six tracks. At ten minutes a day that's roughly seven weeks — and the spacing is what makes it stick, so the slow route genuinely works better.",
  },
];

/** The longer list on /faq, grouped by category. */
export const ALL_FAQS: Faq[] = [
  ...HOME_FAQS.map((f) => ({ ...f, category: "Getting started" })),
  {
    category: "Getting started",
    question: "Does it work on a phone?",
    answer:
      "Yes. The editor, the challenge types and the whole learning path are built for touch first. Writing long queries is more comfortable on a keyboard, but multiple-choice, fill-the-blank and reorder challenges are designed for exactly the phone-on-the-train case.",
  },
  {
    category: "Getting started",
    question: "Does it work offline?",
    answer:
      "Once a lesson page has loaded, yes — the database is already in your browser and grading happens locally. Navigating to a lesson you haven't opened before still needs a connection.",
  },
  {
    category: "The course",
    question: "How are my answers graded?",
    answer:
      "Your query and the reference solution are both executed against identical copies of the dataset, and the two result sets are compared. That means any correct approach passes — there's no hidden string matching against one 'blessed' answer.",
  },
  {
    category: "The course",
    question: "Does row order matter?",
    answer:
      "Only when the question asks for a specific order. If the reference solution has an ORDER BY, ordering is checked; otherwise your rows can come back in any order.",
  },
  {
    category: "The course",
    question: "What if I get stuck?",
    answer:
      "Every challenge has progressive hints — the first nudges you, the last is close to the answer. Revealing hints costs a little XP but nothing else. You can also skip a challenge to see the solution and come back to it in Practice.",
  },
  {
    category: "The course",
    question: "Does it cover interview questions?",
    answer:
      "The Advanced track's checkpoint is built from the questions that actually come up: second-highest salary, top-N per group, running totals, month-over-month change, and gaps-and-islands. The Performance track covers the 'why is this query slow' half.",
  },
  {
    category: "Accounts & data",
    question: "What happens to my progress if I clear my browser data?",
    answer:
      "Without an account, it's gone — local storage is the only copy. You can export a JSON backup at any time from Settings → Data, and import it later.",
  },
  {
    category: "Accounts & data",
    question: "Can I delete my account?",
    answer:
      "Yes, from Settings → Data. Deletion removes your account row and everything that references it, including progress, activity history and achievements.",
  },
  {
    category: "Accounts & data",
    question: "Do you sell my data?",
    answer:
      "No. There are no advertising trackers, no data brokers and no third-party analytics by default. If a deployment enables analytics at all, it's a self-hosted, cookie-free installation.",
  },
  {
    category: "Technical",
    question: "How big is the download?",
    answer:
      "The Postgres WebAssembly bundle is a few megabytes and is fetched once per session, then cached. Everything after that is instant — queries run in single-digit milliseconds because there's no network hop.",
  },
  {
    category: "Technical",
    question: "Can I self-host it?",
    answer:
      "Yes. The repository ships a Dockerfile and a docker compose stack with Postgres. `docker compose up` gives you the whole thing on localhost:3000.",
  },
  {
    category: "Technical",
    question: "Can I contribute a lesson?",
    answer:
      "Please do. Lessons are plain TypeScript objects in src/content/tracks, and a verification script executes every reference solution against a real database in CI — so a broken lesson can't be merged.",
  },
];
