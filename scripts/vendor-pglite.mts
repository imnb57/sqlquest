/**
 * Copies PGlite's published ESM build into `public/pglite/`.
 *
 * Why this exists
 * ---------------
 * PGlite ships Emscripten glue that resolves its own payload with
 * `new URL("./pglite.wasm", import.meta.url)` and calls into a sibling module
 * namespace for `instantiateWasm`. Turbopack's minifier does not preserve that
 * namespace across chunk boundaries, so the bundled copy fails at runtime with
 * `m.instantiateWasm is not a function`.
 *
 * Rather than fight the bundler over a 16 MB WASM dependency that gains nothing
 * from being in the module graph, we serve PGlite's own build verbatim and load
 * it from the worker with a bundler-ignored dynamic import. `import.meta.url`
 * then resolves to `/pglite/index.js`, so the engine finds its `.wasm` and
 * `.data` beside itself exactly as its authors intended.
 *
 * Runs automatically via the `predev` / `prebuild` npm hooks.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "@electric-sql", "pglite", "dist");
const target = join(root, "public", "pglite");

if (!existsSync(source)) {
  console.error("  ✗ @electric-sql/pglite is not installed — run `npm install` first.");
  process.exit(1);
}

/**
 * Copy only what a browser actually loads: ESM, the WASM binaries and the
 * Postgres data image.
 *
 * Everything else in the package is either irrelevant here or actively
 * unhelpful — `.cjs` is for Node, `.d.ts` would get picked up by our own
 * typecheck and lint passes, `.map` is for debugging a dependency we don't
 * debug, and the 36 `*.tar.gz` extension bundles (~9 MB) are only fetched if a
 * lesson opts into an extension. None do; add the ones you need if that changes.
 */
const ALLOWED = [".js", ".wasm", ".data"];

function shouldCopy(name: string): boolean {
  if (name.endsWith(".d.ts") || name.endsWith(".d.cts")) return false;
  return ALLOWED.some((ext) => name.endsWith(ext));
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

let files = 0;
let bytes = 0;

for (const entry of readdirSync(source, { withFileTypes: true })) {
  const from = join(source, entry.name);
  const to = join(target, entry.name);

  if (entry.isDirectory()) {
    // Directories are walked; only their leaf files are filtered.
    cpSync(from, to, {
      recursive: true,
      filter: (src) => statSync(src).isDirectory() || shouldCopy(src),
    });
    continue;
  }

  if (!shouldCopy(entry.name)) continue;
  cpSync(from, to);
  files++;
  bytes += statSync(from).size;
}

console.log(
  `  vendored PGlite → public/pglite (${files} files, ${(bytes / 1048576).toFixed(1)} MB)`,
);
