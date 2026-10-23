"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateCampus } from "@/app/(main)/settings/profile/campus-actions";

export function CampusSettings({
  campuses,
  current,
}: {
  campuses: { id: string; name: string }[];
  current: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(current);
  const [pending, startTransition] = React.useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateCampus(value);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Campus updated");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">Your campus</h2>
      <div className="space-y-2">
        <Label htmlFor="campus-select">Campus</Label>
        <select
          id="campus-select"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Past orders keep the campus they were made at. Your existing listings
          keep theirs too.
        </p>
      </div>
      <Button onClick={save} disabled={pending || !value || value === current}>
        {pending ? "Saving..." : "Save campus"}
      </Button>
    </div>
  );
}
