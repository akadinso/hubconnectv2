"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PhotoPicker } from "@/components/PhotoPicker";
import { cn } from "@/lib/utils";
import { MAX_PHOTOS, removePhotos, uploadPhotos } from "@/lib/upload-photos";
import { submitReview } from "@/app/(main)/listings/[id]/actions";

export function ReviewForm({
  listingId,
  initialRating,
  initialComment,
  isEditing,
  existingPhotoCount = 0,
}: {
  listingId: string;
  initialRating: number;
  initialComment: string;
  isEditing: boolean;
  existingPhotoCount?: number;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [files, setFiles] = useState<File[]>([]);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const uploaded = await uploadPhotos("review-photos", files);
      if ("error" in uploaded) {
        toast.error(uploaded.error);
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
        toast.error(result.error);
        return;
      }

      toast.success(isEditing ? "Review updated" : "Thanks for your review");
      setFiles([]);
      router.refresh();
    });
  }

  const shown = hover || rating;

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="text-sm font-medium">
        {isEditing ? "Edit your review" : "Leave a review"}
      </p>

      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
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
                "size-6",
                value <= shown
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
        maxLength={1000}
        rows={3}
      />

      <PhotoPicker
        files={files}
        onChange={setFiles}
        max={MAX_PHOTOS - existingPhotoCount}
        disabled={pending}
      />

      <Button onClick={handleSubmit} disabled={pending || rating === 0}>
        {pending ? "Saving..." : isEditing ? "Update review" : "Submit review"}
      </Button>
    </div>
  );
}
