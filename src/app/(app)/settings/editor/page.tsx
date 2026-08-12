"use client";

import * as React from "react";

import { Slider, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/form-controls";
import {
  SettingsSection,
  SettingsRow,
  SwitchRow,
} from "@/components/settings/settings-primitives";
import { SqlEditor } from "@/components/sql/sql-editor";
import { useSettingsStore, type ResultDensity } from "@/stores/settings-store";

const PREVIEW_SQL = `SELECT c.name,
       count(*) AS orders,
       sum(oi.quantity * oi.unit_price) AS spend
FROM customers c
JOIN orders o       ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'delivered'
GROUP BY c.name
HAVING count(*) > 1
ORDER BY spend DESC;`;

export default function EditorSettingsPage() {
  const s = useSettingsStore();
  const [preview, setPreview] = React.useState(PREVIEW_SQL);

  return (
    <>
      <SettingsSection
        title="Editor"
        description="Applies to lesson challenges and the playground."
      >
        <SettingsRow label="Font size" stacked>
          <div className="flex items-center gap-4">
            <Slider
              value={[s.editorFontSize]}
              onValueChange={([v]) => s.set("editorFontSize", v)}
              min={11}
              max={22}
              step={1}
              aria-label="Editor font size"
              className="max-w-xs"
            />
            <span className="text-sm font-extrabold tabular-nums">
              {s.editorFontSize}px
            </span>
          </div>
        </SettingsRow>

        <SwitchRow
          id="line-numbers"
          label="Line numbers"
          checked={s.lineNumbers}
          onCheckedChange={(v) => s.set("lineNumbers", v)}
        />
        <SwitchRow
          id="autocomplete"
          label="Schema autocomplete"
          description="Suggests table and column names from the dataset you're querying."
          checked={s.autocompleteEnabled}
          onCheckedChange={(v) => s.set("autocompleteEnabled", v)}
        />
        <SwitchRow
          id="auto-format"
          label="Format on run"
          description="Tidies your SQL each time you press Run."
          checked={s.autoFormatOnRun}
          onCheckedChange={(v) => s.set("autoFormatOnRun", v)}
        />
      </SettingsSection>

      <SettingsSection title="Results">
        <SettingsRow
          label="Row density"
          description="Compact fits roughly a third more rows on screen."
          control={
            <Select
              value={s.resultDensity}
              onValueChange={(v) => s.set("resultDensity", v as ResultDensity)}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </SettingsSection>

      <SettingsSection title="Preview" description="Live — try typing in it.">
        <div className="px-5 py-4">
          <SqlEditor
            value={preview}
            onChange={setPreview}
            minHeight="12rem"
            aria-label="Editor settings preview"
          />
        </div>
      </SettingsSection>
    </>
  );
}
