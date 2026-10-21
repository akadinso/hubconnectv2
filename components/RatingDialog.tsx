"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { removePhotos, uploadPhotos } from "@/lib/upload-photos";
import { submitReview } from "@/app/(main)/listings/[id]/actions";

export function RatingDialog({
  listingId,
  listingTitle,
  listingImage,
  sellerName,
  trigger,
  initialRating = 0,
  initialComment = "",
}: {
  listingId: string;
  listingTitle: string;
  listingImage?: string | null;
  sellerName?: string;
  trigger: React.ReactElement;
  initialRating?: number;
  initialComment?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(initialRating);
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState(initialComment);
  const [files, setFiles] = React.useState<File[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const uploaded = await uploadPhotos("review-photos", files);
      if ("error" in uploaded) {
        setError(uploaded.error);
        return;
      }

      const result = await submitReview(
        listingId,
        rating,
        comment,
        uploaded.paths,
      );
      if (result.error) {
        await removePhotos("review-photos", uploaded.paths);
        setError(result.error);
        return;
      }

      toast.success("Thanks for your rating");
      setFiles([]);
      setOpen(false);
      router.refresh();
    });
  }

  const shown = hover || rating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate your experience</DialogTitle>
          <DialogDescription>
            {sellerName
              ? `How was your order from ${sellerName}?`
              : "How was your order?"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-2">
          <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            {listingImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listingImage}
                alt=""
                className="size-full object-cover"
              />
            )}
          </div>
          <p className="truncate text-sm font-medium">{listingTitle}</p>
        </div>

        <div
          className="flex justify-center gap-1"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(value)}
              onClick={() => setRating(value)}
            >
              <Star
                className={cn(
                  "size-9",
                  value <= shown
                    ? "fill-gold text-gold"
                    : "text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rating-comment">Add a comment (optional)</Label>
          <Textarea
            id="rating-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Tell other students what you thought"
          />
        </div>

        <div className="space-y-2">
          <Label>Photos (optional)</Label>
          <PhotoPicker files={files} onChange={setFiles} disabled={pending} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Not now
          </Button>
          <Button onClick={handleSubmit} disabled={pending || rating === 0}>
            {pending ? "Saving..." : "Submit rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
