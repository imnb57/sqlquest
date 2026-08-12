/**
 * Generates the app's Lottie animations as plain JSON.
 *
 * These are authored in code rather than downloaded so that:
 *   - nothing is fetched from a CDN at runtime (our CSP forbids it),
 *   - every animation is licence-clean and matches the brand palette exactly,
 *   - a palette change is a one-line edit followed by `npm run gen:lottie`.
 *
 * Output: src/animations/*.json  (imported directly, so they're bundled and
 * code-split with the components that use them).
 *
 * Run with: npm run gen:lottie
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "animations");

/* ------------------------------------------------------------------ types */

type Vec = number[];
interface Keyframe {
  t: number;
  s: Vec;
  i?: { x: number[]; y: number[] };
  o?: { x: number[]; y: number[] };
  h?: number;
}
type Animatable = { a: 0; k: Vec | number } | { a: 1; k: Keyframe[] };

/* ---------------------------------------------------------------- palette */

/** Brand colours as Lottie 0–1 RGBA tuples. */
const C = {
  brand: [0.478, 0.361, 0.929, 1],
  brandDeep: [0.325, 0.216, 0.749, 1],
  aqua: [0.243, 0.788, 0.855, 1],
  lime: [0.729, 0.898, 0.259, 1],
  amber: [0.984, 0.749, 0.141, 1],
  orange: [0.976, 0.451, 0.086, 1],
  rose: [0.957, 0.318, 0.435, 1],
  white: [1, 1, 1, 1],
  ink: [0.145, 0.106, 0.271, 1],
} as const;

/* ---------------------------------------------------------------- helpers */

const still = (k: Vec | number): Animatable => ({ a: 0, k });

/** Eased keyframe track. `easing` shapes every segment identically. */
function track(
  frames: [number, Vec][],
  easing: "smooth" | "bounce" | "linear" = "smooth",
): Animatable {
  const ease =
    easing === "bounce"
      ? { i: { x: [0.2], y: [1.6] }, o: { x: [0.6], y: [0] } }
      : easing === "linear"
        ? { i: { x: [1], y: [1] }, o: { x: [0], y: [0] } }
        : { i: { x: [0.35], y: [1] }, o: { x: [0.65], y: [0] } };

  return {
    a: 1,
    k: frames.map(([t, s], idx) =>
      idx === frames.length - 1 ? { t, s } : { t, s, ...ease },
    ),
  };
}

interface TransformOpts {
  position?: Animatable;
  anchor?: Animatable;
  scale?: Animatable;
  rotation?: Animatable;
  opacity?: Animatable;
}

function transform(o: TransformOpts = {}) {
  return {
    o: o.opacity ?? still(100),
    r: o.rotation ?? still(0),
    p: o.position ?? still([0, 0, 0]),
    a: o.anchor ?? still([0, 0, 0]),
    s: o.scale ?? still([100, 100, 100]),
  };
}

function groupTransform(o: TransformOpts = {}) {
  return {
    ty: "tr",
    p: o.position ?? still([0, 0]),
    a: o.anchor ?? still([0, 0]),
    s: o.scale ?? still([100, 100]),
    r: o.rotation ?? still(0),
    o: o.opacity ?? still(100),
  };
}

const fill = (color: readonly number[], opacity: Animatable = still(100)) => ({
  ty: "fl",
  c: still([...color]),
  o: opacity,
  r: 1,
  nm: "fill",
});

const stroke = (
  color: readonly number[],
  width: number,
  opacity: Animatable = still(100),
) => ({
  ty: "st",
  c: still([...color]),
  o: opacity,
  w: still(width),
  lc: 2,
  lj: 2,
  nm: "stroke",
});

const ellipse = (size: Vec, position: Vec = [0, 0]) => ({
  ty: "el",
  p: still(position),
  s: still(size),
  d: 1,
  nm: "ellipse",
});

const rect = (size: Vec, roundness = 0, position: Vec = [0, 0]) => ({
  ty: "rc",
  p: still(position),
  s: still(size),
  r: still(roundness),
  d: 1,
  nm: "rect",
});

const star = (points: number, outer: number, inner: number, rotation = 0) => ({
  ty: "sr",
  sy: 1,
  p: still([0, 0]),
  r: still(rotation),
  pt: still(points),
  or: still(outer),
  ir: still(inner),
  os: still(0),
  is: still(0),
  nm: "star",
});

/** Bezier path from explicit vertices. */
function path(vertices: Vec[], closed = true) {
  return {
    ty: "sh",
    d: 1,
    ks: {
      a: 0,
      k: {
        c: closed,
        v: vertices,
        i: vertices.map(() => [0, 0]),
        o: vertices.map(() => [0, 0]),
      },
    },
    nm: "path",
  };
}

/** Trim paths — the "draw the line on" effect. */
const trim = (endTrack: Animatable, startTrack: Animatable = still(0)) => ({
  ty: "tm",
  s: startTrack,
  e: endTrack,
  o: still(0),
  m: 1,
  nm: "trim",
});

interface LayerOpts {
  name: string;
  shapes: unknown[];
  transform?: TransformOpts;
  in?: number;
  out?: number;
  index: number;
}

function shapeLayer(o: LayerOpts, duration: number) {
  return {
    ddd: 0,
    ind: o.index,
    ty: 4,
    nm: o.name,
    sr: 1,
    ks: transform(o.transform),
    ao: 0,
    shapes: o.shapes,
    ip: o.in ?? 0,
    op: o.out ?? duration,
    st: 0,
    bm: 0,
  };
}

const group = (items: unknown[], name = "group", tr: TransformOpts = {}) => ({
  ty: "gr",
  it: [...items, groupTransform(tr)],
  nm: name,
  np: items.length + 1,
  bm: 0,
  hd: false,
});

interface AnimationOpts {
  name: string;
  width: number;
  height: number;
  duration: number;
  fps?: number;
  layers: unknown[];
}

function animation(o: AnimationOpts) {
  return {
    v: "5.9.0",
    fr: o.fps ?? 60,
    ip: 0,
    op: o.duration,
    w: o.width,
    h: o.height,
    nm: o.name,
    ddd: 0,
    assets: [],
    layers: o.layers,
    markers: [],
  };
}

/* ============================================================ animations == */

/** Looping flame for the streak counter. */
function streakFlame() {
  const D = 90;
  const size = 200;
  const c = size / 2;

  const outer = path([
    [0, -74],
    [30, -28],
    [40, 14],
    [22, 58],
    [-22, 58],
    [-40, 14],
    [-30, -28],
  ]);
  const inner = path([
    [0, -34],
    [17, -4],
    [22, 26],
    [11, 52],
    [-11, 52],
    [-22, 26],
    [-17, -4],
  ]);

  return animation({
    name: "streak-flame",
    width: size,
    height: size,
    duration: D,
    layers: [
      shapeLayer(
        {
          index: 1,
          name: "glow",
          shapes: [group([ellipse([132, 132]), fill(C.orange, still(16))])],
          transform: {
            position: still([c, c + 6, 0]),
            scale: track(
              [
                [0, [88, 88, 100]],
                [D / 2, [108, 108, 100]],
                [D, [88, 88, 100]],
              ],
              "smooth",
            ),
          },
        },
        D,
      ),
      shapeLayer(
        {
          index: 2,
          name: "flame-outer",
          shapes: [group([outer, fill(C.orange)])],
          transform: {
            position: track(
              [
                [0, [c, c + 8, 0]],
                [D / 2, [c, c + 2, 0]],
                [D, [c, c + 8, 0]],
              ],
              "smooth",
            ),
            scale: track(
              [
                [0, [100, 100, 100]],
                [D / 3, [106, 112, 100]],
                [(2 * D) / 3, [96, 104, 100]],
                [D, [100, 100, 100]],
              ],
              "smooth",
            ),
          },
        },
        D,
      ),
      shapeLayer(
        {
          index: 3,
          name: "flame-inner",
          shapes: [group([inner, fill(C.amber)])],
          transform: {
            position: track(
              [
                [0, [c, c + 14, 0]],
                [D / 2, [c, c + 9, 0]],
                [D, [c, c + 14, 0]],
              ],
              "smooth",
            ),
            scale: track(
              [
                [0, [96, 96, 100]],
                [D / 2, [110, 118, 100]],
                [D, [96, 96, 100]],
              ],
              "bounce",
            ),
          },
        },
        D,
      ),
    ],
  });
}

/** One-shot tick for a correct answer. */
function correctCheck() {
  const D = 50;
  const size = 200;
  const c = size / 2;

  return animation({
    name: "correct-check",
    width: size,
    height: size,
    duration: D,
    layers: [
      shapeLayer(
        {
          index: 1,
          name: "ring",
          shapes: [group([ellipse([150, 150]), fill(C.lime, still(22))])],
          transform: {
            position: still([c, c, 0]),
            scale: track(
              [
                [0, [40, 40, 100]],
                [16, [112, 112, 100]],
                [26, [100, 100, 100]],
              ],
              "bounce",
            ),
            opacity: track(
              [
                [0, [0]],
                [10, [100]],
                [D, [100]],
              ],
              "smooth",
            ),
          },
        },
        D,
      ),
      shapeLayer(
        {
          index: 2,
          name: "disc",
          shapes: [group([ellipse([112, 112]), fill(C.lime)])],
          transform: {
            position: still([c, c, 0]),
            scale: track(
              [
                [2, [0, 0, 100]],
                [18, [110, 110, 100]],
                [28, [100, 100, 100]],
              ],
              "bounce",
            ),
          },
        },
        D,
      ),
      shapeLayer(
        {
          index: 3,
          name: "tick",
          shapes: [
            group([
              path(
                [
                  [-26, 2],
                  [-8, 21],
                  [27, -19],
                ],
                false,
              ),
              stroke(C.ink, 13),
              trim(
                track(
                  [
                    [14, [0]],
                    [34, [100]],
                  ],
                  "smooth",
                ),
              ),
            ]),
          ],
          transform: { position: still([c, c, 0]) },
        },
        D,
      ),
    ],
  });
}

/** One-shot cross for a wrong answer. */
function wrongCross() {
  const D = 45;
  const size = 200;
  const c = size / 2;

  return animation({
    name: "wrong-cross",
    width: size,
    height: size,
    duration: D,
    layers: [
      shapeLayer(
        {
          index: 1,
          name: "disc",
          shapes: [group([ellipse([112, 112]), fill(C.rose)])],
          transform: {
            position: still([c, c, 0]),
            scale: track(
              [
                [0, [0, 0, 100]],
                [14, [110, 110, 100]],
                [24, [100, 100, 100]],
              ],
              "bounce",
            ),
            rotation: track(
              [
                [24, [0]],
                [30, [-9]],
                [36, [7]],
                [42, [0]],
              ],
              "smooth",
            ),
          },
        },
        D,
      ),
      shapeLayer(
        {
          index: 2,
          name: "stroke-a",
          shapes: [
            group([
              path(
                [
                  [-22, -22],
                  [22, 22],
                ],
                false,
              ),
              stroke(C.white, 13),
              trim(
                track(
                  [
                    [12, [0]],
                    [26, [100]],
                  ],
                  "smooth",
                ),
              ),
            ]),
          ],
          transform: { position: still([c, c, 0]) },
        },
        D,
      ),
      shapeLayer(
        {
          index: 3,
          name: "stroke-b",
          shapes: [
            group([
              path(
                [
                  [22, -22],
                  [-22, 22],
                ],
                false,
              ),
              stroke(C.white, 13),
              trim(
                track(
                  [
                    [18, [0]],
                    [32, [100]],
                  ],
                  "smooth",
                ),
              ),
            ]),
          ],
          transform: { position: still([c, c, 0]) },
        },
        D,
      ),
    ],
  });
}

/** Level-up burst: rays sweep out behind a rising star. */
function levelUp() {
  const D = 75;
  const size = 240;
  const c = size / 2;

  const rays = Array.from({ length: 12 }, (_, i) =>
    group(
      [rect([9, 46], 4, [0, -74]), fill(i % 2 ? C.aqua : C.lime)],
      `ray-${i}`,
      {
        rotation: still(i * 30),
        scale: track(
          [
            [6 + i, [100, 40, 100]],
            [24 + i, [100, 118, 100]],
            [48 + i, [100, 0, 100]],
          ],
          "smooth",
        ),
        opacity: track(
          [
            [6 + i, [0]],
            [18 + i, [100]],
            [50 + i, [0]],
          ],
          "smooth",
        ),
      },
    ),
  );

  return animation({
    name: "level-up",
    width: size,
    height: size,
    duration: D,
    layers: [
      shapeLayer(
        {
          index: 1,
          name: "rays",
          shapes: rays,
          transform: { position: still([c, c, 0]) },
        },
        D,
      ),
      shapeLayer(
        {
          index: 2,
          name: "halo",
          shapes: [group([ellipse([120, 120]), fill(C.brand, still(26))])],
          transform: {
            position: still([c, c, 0]),
            scale: track(
              [
                [0, [30, 30, 100]],
                [30, [130, 130, 100]],
                [D, [150, 150, 100]],
              ],
              "smooth",
            ),
            opacity: track(
              [
                [0, [0]],
                [16, [100]],
                [D, [0]],
              ],
              "smooth",
            ),
          },
        },
        D,
      ),
      shapeLayer(
        {
          index: 3,
          name: "star",
          shapes: [group([star(5, 52, 24), fill(C.amber)])],
          transform: {
            position: track(
              [
                [0, [c, c + 24, 0]],
                [26, [c, c - 6, 0]],
                [40, [c, c, 0]],
              ],
              "bounce",
            ),
            scale: track(
              [
                [0, [0, 0, 100]],
                [24, [118, 118, 100]],
                [38, [100, 100, 100]],
              ],
              "bounce",
            ),
            rotation: track(
              [
                [0, [-40]],
                [38, [0]],
              ],
              "smooth",
            ),
          },
        },
        D,
      ),
    ],
  });
}

/** Confetti burst for lesson completion. */
function celebrate() {
  const D = 90;
  const size = 300;
  const c = size / 2;
  const colors = [C.brand, C.aqua, C.lime, C.amber, C.rose, C.orange];

  const pieces = Array.from({ length: 22 }, (_, i) => {
    const angle = (i / 22) * Math.PI * 2 + (i % 3) * 0.22;
    const distance = 92 + (i % 5) * 22;
    const delay = (i % 6) * 2;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    return group(
      [
        i % 3 === 0 ? ellipse([13, 13]) : rect([11, 17], 3),
        fill(colors[i % colors.length]),
      ],
      `piece-${i}`,
      {
        position: track(
          [
            [delay, [0, 0]],
            [delay + 34, [dx, dy]],
            [delay + 62, [dx * 1.12, dy * 1.12 + 46]],
          ],
          "smooth",
        ),
        rotation: track(
          [
            [delay, [0]],
            [delay + 62, [i % 2 ? 320 : -280]],
          ],
          "linear",
        ),
        scale: track(
          [
            [delay, [0, 0]],
            [delay + 12, [100, 100]],
            [delay + 62, [70, 70]],
          ],
          "bounce",
        ),
        opacity: track(
          [
            [delay, [0]],
            [delay + 8, [100]],
            [delay + 48, [100]],
            [delay + 66, [0]],
          ],
          "smooth",
        ),
      },
    );
  });

  return animation({
    name: "celebrate",
    width: size,
    height: size,
    duration: D,
    layers: [
      shapeLayer(
        {
          index: 1,
          name: "confetti",
          shapes: pieces,
          transform: { position: still([c, c, 0]) },
        },
        D,
      ),
    ],
  });
}

/** Looping loader shown while the Postgres WASM engine boots. */
function bootingEngine() {
  const D = 90;
  const size = 200;
  const c = size / 2;

  const disc = (y: number, delay: number, color: readonly number[]) =>
    group([ellipse([104, 30], [0, y]), fill(color)], `disc-${y}`, {
      scale: track(
        [
          [delay, [100, 100]],
          [delay + 22, [112, 112]],
          [delay + 44, [100, 100]],
          [D, [100, 100]],
        ],
        "smooth",
      ),
      opacity: track(
        [
          [delay, [55]],
          [delay + 22, [100]],
          [delay + 44, [55]],
          [D, [55]],
        ],
        "smooth",
      ),
    });

  return animation({
    name: "booting-engine",
    width: size,
    height: size,
    duration: D,
    layers: [
      shapeLayer(
        {
          index: 1,
          name: "stack",
          shapes: [
            disc(34, 0, C.brandDeep),
            disc(2, 12, C.brand),
            disc(-30, 24, C.aqua),
          ],
          transform: { position: still([c, c, 0]) },
        },
        D,
      ),
      shapeLayer(
        {
          index: 2,
          name: "orbit",
          shapes: [
            group([ellipse([14, 14], [66, 0]), fill(C.lime)], "dot", {
              rotation: track(
                [
                  [0, [0]],
                  [D, [360]],
                ],
                "linear",
              ),
            }),
          ],
          transform: { position: still([c, c - 30, 0]) },
        },
        D,
      ),
    ],
  });
}

/** The mascot: a friendly database sprite that blinks and bobs. */
function mascotIdle() {
  const D = 150;
  const size = 240;
  const c = size / 2;

  const body = [
    group([ellipse([132, 40], [0, 46]), fill(C.brandDeep)], "base"),
    group([rect([132, 84], 0, [0, 12]), fill(C.brand)], "barrel"),
    group([ellipse([132, 40], [0, -30]), fill(C.aqua)], "top"),
  ];

  const eye = (x: number) =>
    group([ellipse([17, 17], [x, 6]), fill(C.ink)], `eye-${x}`, {
      scale: track(
        [
          [0, [100, 100]],
          [96, [100, 100]],
          [101, [100, 12]],
          [106, [100, 100]],
          [D, [100, 100]],
        ],
        "linear",
      ),
    });

  return animation({
    name: "mascot-idle",
    width: size,
    height: size,
    duration: D,
    layers: [
      shapeLayer(
        {
          index: 1,
          name: "shadow",
          shapes: [group([ellipse([120, 22], [0, 96]), fill(C.ink, still(12))])],
          transform: {
            position: still([c, c, 0]),
            scale: track(
              [
                [0, [100, 100, 100]],
                [D / 2, [88, 100, 100]],
                [D, [100, 100, 100]],
              ],
              "smooth",
            ),
          },
        },
        D,
      ),
      shapeLayer(
        {
          index: 2,
          name: "mascot",
          shapes: [
            ...body,
            eye(-26),
            eye(26),
            group(
              [
                path(
                  [
                    [-16, 30],
                    [0, 40],
                    [16, 30],
                  ],
                  false,
                ),
                stroke(C.ink, 7),
              ],
              "smile",
            ),
          ],
          transform: {
            position: track(
              [
                [0, [c, c, 0]],
                [D / 2, [c, c - 12, 0]],
                [D, [c, c, 0]],
              ],
              "smooth",
            ),
            rotation: track(
              [
                [0, [-2]],
                [D / 2, [2]],
                [D, [-2]],
              ],
              "smooth",
            ),
          },
        },
        D,
      ),
    ],
  });
}

/** Empty-state animation: a magnifying glass sweeping over a table. */
function emptySearch() {
  const D = 110;
  const size = 220;
  const c = size / 2;

  const rows = Array.from({ length: 4 }, (_, i) =>
    group(
      [rect([104, 12], 6, [0, -30 + i * 22]), fill(C.brand, still(i === 0 ? 55 : 24))],
      `row-${i}`,
    ),
  );

  return animation({
    name: "empty-search",
    width: size,
    height: size,
    duration: D,
    layers: [
      shapeLayer(
        {
          index: 1,
          name: "table",
          shapes: rows,
          transform: { position: still([c, c + 6, 0]) },
        },
        D,
      ),
      shapeLayer(
        {
          index: 2,
          name: "lens",
          shapes: [
            group([ellipse([58, 58]), stroke(C.aqua, 9)], "ring"),
            group(
              [
                path(
                  [
                    [21, 21],
                    [40, 40],
                  ],
                  false,
                ),
                stroke(C.aqua, 9),
              ],
              "handle",
            ),
          ],
          transform: {
            position: track(
              [
                [0, [c - 42, c - 10, 0]],
                [55, [c + 42, c + 22, 0]],
                [D, [c - 42, c - 10, 0]],
              ],
              "smooth",
            ),
          },
        },
        D,
      ),
    ],
  });
}

/* ==================================================================== main */

const files: Record<string, unknown> = {
  "streak-flame.json": streakFlame(),
  "correct-check.json": correctCheck(),
  "wrong-cross.json": wrongCross(),
  "level-up.json": levelUp(),
  "celebrate.json": celebrate(),
  "booting-engine.json": bootingEngine(),
  "mascot-idle.json": mascotIdle(),
  "empty-search.json": emptySearch(),
};

mkdirSync(OUT_DIR, { recursive: true });

let total = 0;
for (const [name, data] of Object.entries(files)) {
  const json = JSON.stringify(data);
  writeFileSync(join(OUT_DIR, name), json);
  total += json.length;
  console.log(`  ${name.padEnd(22)} ${(json.length / 1024).toFixed(1)} KB`);
}
console.log(`\n  ${Object.keys(files).length} animations, ${(total / 1024).toFixed(1)} KB total\n`);
