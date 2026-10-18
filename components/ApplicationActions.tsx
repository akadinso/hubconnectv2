"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reviewApplication } from "@/app/admin/seller-applications/actions";

export function ApplicationActions({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function run(decision: "approved" | "rejected") {
    startTransition(async () => {
      const result = await reviewApplication(id, decision, note);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        decision === "approved" ? "Seller approved" : "Application rejected",
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Note to the applicant (required to reject)"
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => run("approved")}>
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run("rejected")}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
