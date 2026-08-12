/**
 * Lessons run full-bleed with no app chrome — the only affordances on screen
 * are the progress bar, the exit button and the answer UI. Everything else is
 * a distraction from the one thing the learner is doing.
 */
export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return <div id="main">{children}</div>;
}
