"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Download, Trash2, Upload, UserX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SettingsSection, SettingsRow } from "@/components/settings/settings-primitives";
import {
  useProgressStore,
  serialisableProgress,
} from "@/stores/progress-store";
import { useSettingsStore } from "@/stores/settings-store";
import { signOutAndClear } from "@/lib/auth/sign-out";

/**
 * Data management: export, import and delete.
 *
 * Export is a plain JSON download of everything the app knows about you —
 * no request required, because it's all in this browser already.
 */
export default function DataSettingsPage() {
  const { data: session, status } = useSession();

  const [confirmText, setConfirmText] = React.useState("");
  const [resetOpen, setResetOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [confirmEmail, setConfirmEmail] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const accountEmail = session?.user?.email ?? "";

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmEmail }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Could not delete the account.");
      }
      toast.success("Account deleted");
      // Signs out and wipes this browser's copy on the way to the homepage.
      await signOutAndClear();
    } catch (error) {
      toast.error("Deletion failed", {
        description: error instanceof Error ? error.message : undefined,
      });
      setDeleting(false);
    }
  };

  const resetProgress = useProgressStore((s) => s.resetProgress);
  const hydrateFromServer = useProgressStore((s) => s.hydrateFromServer);
  const resetSettings = useSettingsStore((s) => s.reset);

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "SQLQuest",
      version: 1,
      progress: serialisableProgress(useProgressStore.getState()),
      settings: useSettingsStore.getState(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sqlquest-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  };

  const importData = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        progress?: Record<string, unknown>;
        settings?: Record<string, unknown>;
      };
      if (!parsed.progress) throw new Error("No progress found in that file.");

      hydrateFromServer(parsed.progress);
      if (parsed.settings) {
        useSettingsStore.getState().patch(parsed.settings);
      }
      toast.success("Progress imported", {
        description: "Anything newer on this device was kept.",
      });
    } catch (error) {
      toast.error("Import failed", {
        description:
          error instanceof Error ? error.message : "That doesn't look like a SQLQuest export.",
      });
    }
  };

  return (
    <>
      <SettingsSection
        title="Your data"
        description="Everything SQLQuest stores about you, in one file."
      >
        <SettingsRow
          label="Export"
          description="Downloads your full progress and preferences as JSON. Nothing is sent anywhere — the file is generated in your browser."
          control={
            <Button variant="outline" onClick={exportData}>
              <Download />
              Export
            </Button>
          }
        />

        <SettingsRow
          label="Import"
          description="Restore from a previous export. Existing progress is merged, keeping whichever value is further along."
          control={
            <>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importData(file);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" onClick={() => fileInput.current?.click()}>
                <Upload />
                Import
              </Button>
            </>
          }
        />
      </SettingsSection>

      <SettingsSection
        title="Danger zone"
        description="These actions cannot be undone."
        className="border-danger/35"
      >
        <SettingsRow
          label="Reset all progress"
          description="Wipes XP, levels, streaks, achievements and every lesson record from this browser. Your preferences are kept."
          control={
            <Button variant="danger" onClick={() => setResetOpen(true)}>
              <Trash2 />
              Reset progress
            </Button>
          }
        />

        <SettingsRow
          label="Reset preferences"
          description="Returns theme, sound, editor and privacy options to their defaults. Progress is untouched."
          control={
            <Button
              variant="outline"
              onClick={() => {
                resetSettings();
                toast.success("Preferences reset");
              }}
            >
              Reset preferences
            </Button>
          }
        />

        {status === "authenticated" && (
          <SettingsRow
            label="Delete account"
            description="Permanently removes your account and everything attached to it — profile, synced progress, activity history, achievements and saved queries. This cannot be undone."
            control={
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                <UserX />
                Delete account
              </Button>
            }
          />
        )}
      </SettingsSection>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset all progress?</DialogTitle>
            <DialogDescription>
              This deletes every lesson record, all XP, your streak and your
              achievements from this browser. It cannot be undone — export
              first if you might want it back.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label
              htmlFor="confirm-reset"
              className="text-sm font-bold"
            >
              Type <span className="font-mono text-danger">RESET</span> to confirm
            </label>
            <Input
              id="confirm-reset"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-1.5 font-mono"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={confirmText !== "RESET"}
              onClick={() => {
                resetProgress();
                setResetOpen(false);
                setConfirmText("");
                toast.success("Progress reset");
              }}
            >
              <Trash2 />
              Delete everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This removes your profile, synced progress, activity history,
              achievements and saved queries from our servers permanently.
              There is no recovery and no grace period.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border-base bg-bg-subtle p-4 text-sm text-fg-muted">
            Want to keep your progress? Close this and{" "}
            <strong className="font-extrabold text-fg">export your data</strong>{" "}
            first — the file can be imported into a new account later.
          </div>

          <div>
            <label htmlFor="confirm-email" className="text-sm font-bold">
              Type <span className="font-mono text-danger">{accountEmail}</span>{" "}
              to confirm
            </label>
            <Input
              id="confirm-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="mt-1.5 font-mono"
              autoComplete="off"
              placeholder={accountEmail}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Keep my account
            </Button>
            <Button
              variant="danger"
              disabled={
                deleting ||
                confirmEmail.trim().toLowerCase() !== accountEmail.toLowerCase()
              }
              onClick={() => void deleteAccount()}
            >
              <UserX />
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
