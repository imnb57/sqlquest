import type { Challenge, Lesson, LessonRef, Track, Unit } from "./types";
import { lessonXp } from "./types";
import { foundations } from "./tracks/foundations";
import { joins } from "./tracks/joins";
import { aggregation } from "./tracks/aggregation";
import { advanced } from "./tracks/advanced";
import { dataTrack } from "./tracks/data";
import { performance } from "./tracks/performance";

/**
 * The curriculum registry.
 *
 * Tracks are ordered: this array *is* the learning path, and the index of a
 * lesson within the flattened list drives unlock gating and the skill-tree
 * layout. Adding a lesson in the middle shifts everything after it, which is
 * intentional — progress is stored by lesson id, never by index.
 */
export const tracks: Track[] = [
  foundations,
  joins,
  aggregation,
  advanced,
  dataTrack,
  performance,
];

/* -------------------------------------------------------------- flattening */

const lessonRefs: LessonRef[] = [];
const lessonBySlug = new Map<string, LessonRef>();
const lessonById = new Map<string, LessonRef>();
const trackBySlug = new Map<string, Track>();
const unitBySlug = new Map<string, { unit: Unit; track: Track }>();

let index = 0;
for (const track of tracks) {
  trackBySlug.set(track.slug, track);
  for (const unit of track.units) {
    unitBySlug.set(unit.slug, { unit, track });
    for (const lesson of unit.lessons) {
      const ref: LessonRef = { lesson, unit, track, index: index++ };
      lessonRefs.push(ref);
      lessonBySlug.set(lesson.slug, ref);
      lessonById.set(lesson.id, ref);
    }
  }
}

/* ---------------------------------------------------------------- accessors */

export const allLessons: readonly LessonRef[] = lessonRefs;

export function getTrack(slug: string): Track | undefined {
  return trackBySlug.get(slug);
}

export function getUnit(slug: string) {
  return unitBySlug.get(slug);
}

export function getLessonBySlug(slug: string): LessonRef | undefined {
  return lessonBySlug.get(slug);
}

export function getLessonById(id: string): LessonRef | undefined {
  return lessonById.get(id);
}

export function getNextLesson(slug: string): LessonRef | undefined {
  const current = lessonBySlug.get(slug);
  if (!current) return undefined;
  return lessonRefs[current.index + 1];
}

export function getPreviousLesson(slug: string): LessonRef | undefined {
  const current = lessonBySlug.get(slug);
  if (!current || current.index === 0) return undefined;
  return lessonRefs[current.index - 1];
}

/* ------------------------------------------------------------------ totals */

export interface CurriculumStats {
  tracks: number;
  units: number;
  lessons: number;
  challenges: number;
  totalXp: number;
  totalMinutes: number;
}

function computeStats(): CurriculumStats {
  let units = 0;
  let challenges = 0;
  let totalXp = 0;
  let totalMinutes = 0;

  for (const track of tracks) {
    units += track.units.length;
    for (const unit of track.units) {
      for (const lesson of unit.lessons) {
        challenges += lesson.challenges.length;
        totalXp += lessonXp(lesson);
        totalMinutes += lesson.estimatedMinutes;
      }
    }
  }

  return {
    tracks: tracks.length,
    units,
    lessons: lessonRefs.length,
    challenges,
    totalXp,
    totalMinutes,
  };
}

/** Computed once at module load — the whole curriculum is static. */
export const curriculumStats: CurriculumStats = computeStats();

/* ------------------------------------------------------------------ search */

export interface SearchHit {
  kind: "lesson" | "track";
  title: string;
  description: string;
  href: string;
  breadcrumb: string;
}

/** Tiny in-memory search used by the command palette. No index needed. */
export function searchCurriculum(query: string, limit = 8): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const hits: (SearchHit & { score: number })[] = [];

  for (const track of tracks) {
    const hay = `${track.title} ${track.subtitle} ${track.description}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        kind: "track",
        title: track.title,
        description: track.subtitle,
        href: `/courses/${track.slug}`,
        breadcrumb: track.level,
        score: track.title.toLowerCase().startsWith(q) ? 0 : 2,
      });
    }
  }

  for (const { lesson, unit, track } of lessonRefs) {
    const hay =
      `${lesson.title} ${lesson.subtitle} ${lesson.objective} ${lesson.keywords.join(" ")}`.toLowerCase();
    if (!hay.includes(q)) continue;
    hits.push({
      kind: "lesson",
      title: lesson.title,
      description: lesson.subtitle,
      href: `/learn/${lesson.slug}`,
      breadcrumb: `${track.title} · ${unit.title}`,
      score: lesson.title.toLowerCase().includes(q) ? 1 : 3,
    });
  }

  return hits
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ score: _score, ...hit }) => hit);
}

/* ------------------------------------------------------------ unlock logic */

/**
 * A lesson unlocks when its explicit `requires` are met. Lessons without
 * `requires` unlock as soon as the previous lesson in the path is complete,
 * so the whole curriculum forms one gently-gated line with optional branches.
 */
export function isLessonUnlocked(
  lessonId: string,
  completedLessonIds: ReadonlySet<string>,
): boolean {
  const ref = lessonById.get(lessonId);
  if (!ref) return false;
  if (ref.index === 0) return true;

  if (ref.lesson.requires?.length) {
    return ref.lesson.requires.every((id) => completedLessonIds.has(id));
  }

  const prev = lessonRefs[ref.index - 1];
  return prev ? completedLessonIds.has(prev.lesson.id) : true;
}

/** First incomplete lesson — powers the dashboard's "Continue" button. */
export function getResumeLesson(
  completedLessonIds: ReadonlySet<string>,
): LessonRef | undefined {
  return (
    lessonRefs.find((r) => !completedLessonIds.has(r.lesson.id)) ??
    lessonRefs[lessonRefs.length - 1]
  );
}

/* -------------------------------------------------------- challenge lookup */

export function findChallenge(
  lessonSlug: string,
  challengeId: string,
): Challenge | undefined {
  return lessonBySlug.get(lessonSlug)?.lesson.challenges.find((c) => c.id === challengeId);
}

export function lessonsForTrack(trackSlug: string): Lesson[] {
  const track = trackBySlug.get(trackSlug);
  if (!track) return [];
  return track.units.flatMap((u) => u.lessons);
}
