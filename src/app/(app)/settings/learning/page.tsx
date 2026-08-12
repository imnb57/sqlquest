"use client";

import { Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/form-controls";
import {
  SettingsSection,
  SettingsRow,
  SwitchRow,
} from "@/components/settings/settings-primitives";
import { useSettingsStore } from "@/stores/settings-store";
import { useProgressStore } from "@/stores/progress-store";

const GOAL_PRESETS = [
  { xp: 20, label: "Casual", blurb: "~5 minutes a day" },
  { xp: 50, label: "Regular", blurb: "~10 minutes a day" },
  { xp: 100, label: "Serious", blurb: "~20 minutes a day" },
  { xp: 150, label: "Intense", blurb: "~30 minutes a day" },
];

export default function LearningSettingsPage() {
  const s = useSettingsStore();
  const dailyGoal = useProgressStore((st) => st.dailyGoal);
  const setDailyGoal = useProgressStore((st) => st.setDailyGoal);

  return (
    <>
      <SettingsSection
        title="Daily goal"
        description="How much XP you're aiming for each day. Streaks count any day you hit it."
      >
        <div className="px-5 py-4">
          <div className="grid gap-2 sm:grid-cols-4">
            {GOAL_PRESETS.map((preset) => (
              <button
                key={preset.xp}
                type="button"
                onClick={() => setDailyGoal(preset.xp)}
                aria-pressed={dailyGoal === preset.xp}
                className={
                  "btn-3d rounded-xl border-2 p-3 text-left transition-all " +
                  (dailyGoal === preset.xp
                    ? "border-brand-500 bg-brand-500/10 shadow-[0_3px_0_0_var(--color-brand-500)]"
                    : "border-border-base bg-bg-elevated shadow-[0_3px_0_0_var(--border)] hover:border-border-strong")
                }
              >
                <span className="block text-sm font-extrabold">{preset.label}</span>
                <span className="block text-xs text-fg-muted">{preset.blurb}</span>
                <Badge variant="xp" size="sm" className="mt-1.5">
                  <Zap />
                  {preset.xp} XP
                </Badge>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold">Custom goal</span>
              <span className="text-sm font-extrabold tabular-nums">
                {dailyGoal} XP
              </span>
            </div>
            <Slider
              value={[dailyGoal]}
              onValueChange={([v]) => setDailyGoal(v)}
              min={10}
              max={200}
              step={5}
              aria-label="Daily XP goal"
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Difficulty"
        description="Tune how much help the lessons give you."
      >
        <SwitchRow
          id="hard-mode"
          label="Hard mode"
          description="Removes the starter scaffolding from query challenges — you write every statement from a blank editor."
          checked={s.hardMode}
          onCheckedChange={(v) => s.set("hardMode", v)}
        />
        <SwitchRow
          id="show-expected"
          label="Show expected output on failure"
          description="Displays the correct result set beside yours so you can spot the difference. Turn off for a stricter challenge."
          checked={s.showExpectedOnFail}
          onCheckedChange={(v) => s.set("showExpectedOnFail", v)}
        />
        <SwitchRow
          id="hearts"
          label="Hearts"
          description="Wrong answers cost a heart, and running out pauses new lessons until they regenerate. Turn off to remove all pressure."
          checked={s.heartsEnabled}
          onCheckedChange={(v) => s.set("heartsEnabled", v)}
        />
        <SwitchRow
          id="auto-advance"
          label="Auto-advance after a correct answer"
          description="Moves to the next challenge automatically. Explanations always wait for you."
          checked={s.autoAdvance}
          onCheckedChange={(v) => s.set("autoAdvance", v)}
        />
      </SettingsSection>

      <SettingsSection title="About the difficulty curve">
        <SettingsRow
          label="How lessons unlock"
          description="Each lesson unlocks when the one before it is complete. Checkpoints (⚔️) gather everything from their track and are worth the most XP. Nothing is ever permanently locked — you can replay any completed lesson from Practice."
        />
      </SettingsSection>
    </>
  );
}
