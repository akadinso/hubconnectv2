"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type PanelAction = {
  label: string;
  variant?: "default" | "outline" | "destructive" | "secondary";
  run: (note: string) => Promise<{ error?: string }>;
};

export function ResolutionPanel({
  actions,
  closed,
  closedNote,
}: {
  actions: PanelAction[];
  closed?: boolean;
  closedNote?: string | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  if (closed) {
    return (
      <div className="space-y-1 rounded-xl border p-4">
        <p className="text-sm font-medium">Admin note</p>
        <p className="text-sm text-muted-foreground">
          {closedNote || "No note."}
        </p>
      </div>
    );
  }

  function handle(action: PanelAction) {
    startTransition(async () => {
      const result = await action.run(note);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Updated");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <Label htmlFor="admin-note">Admin note</Label>
      <Textarea
        id="admin-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="What was decided and why (required to close)"
      />
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.label}
            variant={a.variant ?? "default"}
            disabled={pending}
            onClick={() => handle(a)}
          >
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
