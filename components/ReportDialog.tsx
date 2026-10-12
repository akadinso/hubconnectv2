"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { COPY, REASONS, type ReportKind } from "@/lib/report-reasons";
import { openDispute, submitReport } from "@/app/actions/trust";

type Props = {
  kind: ReportKind;
  trigger: React.ReactElement;
  targetUserId?: string;
  targetListingId?: string;
  orderId?: string;
};

export function ReportDialog({
  kind,
  trigger,
  targetUserId,
  targetListingId,
  orderId,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const copy = COPY[kind];

  async function handleSubmit() {
    if (!reason) {
      setError("Please choose a reason.");
      return;
    }
    setPending(true);
    setError(null);

    const result =
      kind === "dispute"
        ? await openDispute(orderId!, reason, details)
        : await submitReport({
            kind,
            targetUserId,
            targetListingId,
            reason,
            details,
          });

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    toast.success(
      kind === "dispute"
        ? "Dispute opened. We'll review it shortly."
        : "Report sent. Thanks for helping keep HubConnect safe.",
    );
    setOpen(false);
    setReason("");
    setDetails("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-2">
          <legend className="sr-only">Reason</legend>
          {REASONS[kind].map((r) => (
            <label
              key={r}
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-foreground"
            >
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-foreground"
              />
              {r}
            </label>
          ))}
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="report-details">Additional details (optional)</Label>
          <Textarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Anything that helps us look into it"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Sending..." : copy.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
