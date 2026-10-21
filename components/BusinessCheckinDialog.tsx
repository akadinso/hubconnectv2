"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  snoozeCheckin,
  submitCheckin,
} from "@/app/(main)/seller/checkin/actions";

const OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_sure", label: "Not sure" },
];

function Question({
  legend,
  name,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="accent-primary"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function BusinessCheckinDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(true);
  const [registered, setRegistered] = React.useState("");
  const [bank, setBank] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function later() {
    setOpen(false);
    await snoozeCheckin();
    router.refresh();
  }

  async function submit() {
    setPending(true);
    const result = await submitCheckin(registered, bank);
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Thanks! We'll use this to point you to the right support.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) void later(); // closing counts as "remind me later"
      }}
    >
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick business check-in</DialogTitle>
          <DialogDescription>
            Two quick questions so the Incubation Hub can point you to the right
            support.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Question
            legend="Is your business registered (for example with CIPC)?"
            name="registered"
            value={registered}
            onChange={setRegistered}
          />
          <Question
            legend="Do you have a separate business bank account?"
            name="bank"
            value={bank}
            onChange={setBank}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={later} disabled={pending}>
            Remind me later
          </Button>
          <Button onClick={submit} disabled={pending || !registered || !bank}>
            {pending ? "Saving..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
