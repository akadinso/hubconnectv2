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
import { cn } from "@/lib/utils";
import { submitReview } from "@/app/(main)/listings/[id]/actions";
import { removePhotos, uploadPhotos } from "@/lib/upload-photos";
export function RatingDialog({
  listingId,
  listingTitle,
  trigger,
  initialRating = 0,
  initialComment = "",
}: {
  listingId: string;
  listingTitle: string;
  trigger: React.ReactElement;
  initialRating?: number;
  initialComment?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(initialRating);
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState(initialComment);
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
      toast.success("Thanks for your review");
      setFiles([]);
      setOpen(false);
      router.refresh();
    });
  }

  const shown = hover || rating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate your experience</DialogTitle>
          <DialogDescription className="truncate">
            {listingTitle}
          </DialogDescription>
        </DialogHeader>

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
                  "size-8",
                  value <= shown
                    ? "fill-yellow-400 text-yellow-400"
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
          <Button onClick={handleSubmit} disabled={pending || rating === 0}>
            {pending ? "Saving..." : "Submit review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
