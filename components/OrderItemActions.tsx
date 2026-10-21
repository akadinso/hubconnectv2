"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ReportDialog } from "@/components/ReportDialog";
import { RatingDialog } from "@/components/RatingDialog";
import {
  cancelItem,
  confirmReceived,
  markHandedOver,
} from "@/app/(main)/orders/actions";

type Props = {
  role: "buyer" | "seller";
  itemId: string;
  orderId: string;
  listingId: string | null;
  title: string;
  status: string;
  image?: string | null;
  sellerName?: string;
};

function Confirm({
  trigger,
  title,
  description,
  confirmLabel,
  busy,
  onConfirm,
}: {
  trigger: React.ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Not yet
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              await onConfirm();
              setOpen(false);
            }}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function OrderItemActions({
  role,
  itemId,
  orderId,
  listingId,
  title,
  status,
  image,
  sellerName,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function run(
    fn: (id: string) => Promise<{ error?: string }>,
    success: string,
  ) {
    setBusy(true);
    const result = await fn(itemId);
    setBusy(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(success);
    router.refresh();
  }

  const open = status === "pending" || status === "confirmed";

  return (
    <div className="flex flex-wrap gap-2">
      {role === "buyer" && (status === "pending" || status === "confirmed") && (
        <Confirm
          trigger={<Button size="sm">Item received</Button>}
          title="Confirm you received this item?"
          description="This releases your payment to the seller and can't be undone. If something is wrong, open a dispute instead."
          confirmLabel="Yes, I received it"
          busy={busy}
          onConfirm={() =>
            run(confirmReceived, "Payment released to the seller")
          }
        />
      )}

      {role === "buyer" && open && (
        <ReportDialog
          kind="dispute"
          orderId={orderId}
          trigger={
            <Button size="sm" variant="outline" type="button">
              Open dispute
            </Button>
          }
        />
      )}

      {role === "buyer" && status === "completed" && listingId && (
        <RatingDialog
          listingId={listingId}
          listingTitle={title}
          listingImage={image}
          sellerName={sellerName}
          trigger={
            <Button size="sm" variant="outline" type="button">
              Rate your experience
            </Button>
          }
        />
      )}

      {role === "seller" && open && (
        <Confirm
          trigger={
            <Button size="sm" variant="outline">
              Cancel &amp; refund buyer
            </Button>
          }
          title="Cancel this order item?"
          description="The buyer is refunded in full."
          confirmLabel="Cancel and refund"
          busy={busy}
          onConfirm={() => run(cancelItem, "Item cancelled and buyer refunded")}
        />
      )}
    </div>
  );
}
