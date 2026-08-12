"use client";

import { ThemeSegmented } from "@/components/theme-toggle";
import {
  SettingsSection,
  SettingsRow,
  SwitchRow,
} from "@/components/settings/settings-primitives";
import { useSettingsStore } from "@/stores/settings-store";
import { Button } from "@/components/ui/button";
import { playSound } from "@/lib/feedback";

export default function AppearanceSettingsPage() {
  const s = useSettingsStore();

  return (
    <>
      <SettingsSection
        title="Theme"
        description="System follows your operating system's light/dark setting."
      >
        <SettingsRow label="Colour theme" stacked>
          <ThemeSegmented />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Motion & effects"
        description="Everything here also respects your OS 'reduce motion' setting automatically."
      >
        <SwitchRow
          id="reduced-motion"
          label="Reduce motion"
          description="Disables Lottie animations, confetti and transitions across the app."
          checked={s.reducedMotion}
          onCheckedChange={(v) => s.set("reducedMotion", v)}
        />
        <SwitchRow
          id="confetti"
          label="Confetti"
          description="Celebrate correct streaks and completed lessons."
          checked={s.confettiEnabled}
          onCheckedChange={(v) => s.set("confettiEnabled", v)}
          disabled={s.reducedMotion}
        />
      </SettingsSection>

      <SettingsSection title="Sound & haptics">
        <SwitchRow
          id="sound"
          label="Sound effects"
          description="Short tones for correct answers, level-ups and unlocks. Generated in the browser — nothing is downloaded."
          checked={s.soundEnabled}
          onCheckedChange={(v) => {
            s.set("soundEnabled", v);
            if (v) setTimeout(() => playSound("correct"), 60);
          }}
        />
        <SwitchRow
          id="haptics"
          label="Haptic feedback"
          description="Vibration on supported mobile devices."
          checked={s.hapticsEnabled}
          onCheckedChange={(v) => s.set("hapticsEnabled", v)}
        />
        <SettingsRow
          label="Preview"
          description="Hear what the feedback sounds like."
          control={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => playSound("correct")}>
                Correct
              </Button>
              <Button variant="outline" size="sm" onClick={() => playSound("levelUp")}>
                Level up
              </Button>
            </div>
          }
        />
      </SettingsSection>
    </>
  );
}
