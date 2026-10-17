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
import { PhotoPicker } from "@/components/PhotoPicker";
import { COPY, REASONS, type ReportKind } from "@/lib/report-reasons";
import { removePhotos, uploadPhotos } from "@/lib/upload-photos";
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
  const [files, setFiles] = React.useState<File[]>([]);
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

    const uploaded = await uploadPhotos("report-photos", files);
    if ("error" in uploaded) {
      setError(uploaded.error);
      setPending(false);
      return;
    }

    const result =
      kind === "dispute"
        ? await openDispute(orderId!, reason, details, uploaded.paths)
        : await submitReport({
            kind,
            targetUserId,
            targetListingId,
            reason,
            details,
            photos: uploaded.paths,
          });

    if (result.error) {
      await removePhotos("report-photos", uploaded.paths); // don't leave orphans behind
      setError(result.error);
      setPending(false);
      return;
    }

    setPending(false);
    toast.success(
      kind === "dispute"
        ? "Dispute opened. We'll review it shortly."
        : "Report sent. Thanks for helping keep HubConnect safe.",
    );
    setOpen(false);
    setReason("");
    setDetails("");
    setFiles([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
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

        <div className="space-y-2">
          <Label>Photos of the product (optional, up to 4)</Label>
          <PhotoPicker files={files} onChange={setFiles} disabled={pending} />
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
