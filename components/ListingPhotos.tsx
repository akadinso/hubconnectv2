"use client";

import * as React from "react";
import { ImagePlus, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { validatePhoto } from "@/lib/upload-photos";

export type PhotoSlot = { id: string; url: string; file?: File };
export const MAX_LISTING_PHOTOS = 4;

export function ListingPhotos({
  slots,
  onChange,
  onError,
  disabled,
}: {
  slots: PhotoSlot[];
  onChange: (slots: PhotoSlot[]) => void;
  onError: (message: string | null) => void;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    onError(null);

    const next = [...slots];
    for (const file of picked) {
      if (next.length >= MAX_LISTING_PHOTOS) {
        onError(`You can add up to ${MAX_LISTING_PHOTOS} photos.`);
        break;
      }
      const problem = validatePhoto(file);
      if (problem) {
        onError(problem);
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
      });
    }
    onChange(next);
  }

  function remove(id: string) {
    const slot = slots.find((s) => s.id === id);
    if (slot?.file) URL.revokeObjectURL(slot.url);
    onChange(slots.filter((s) => s.id !== id));
  }

  function makeCover(id: string) {
    const slot = slots.find((s) => s.id === id);
    if (slot) onChange([slot, ...slots.filter((s) => s.id !== id)]);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: MAX_LISTING_PHOTOS }).map((_, i) => {
        const slot = slots[i];

        if (!slot) {
          return (
            <button
              key={`empty-${i}`}
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-muted/50 text-xs text-muted-foreground hover:bg-muted"
            >
              <ImagePlus className="size-6" />
              Add photo
            </button>
          );
        }

        return (
          <div
            key={slot.id}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-xl border bg-muted",
              i === 0 && "ring-2 ring-primary",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slot.url}
              alt={`Photo ${i + 1}`}
              className="size-full object-cover"
            />

            {i === 0 ? (
              <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                Cover
              </span>
            ) : (
              <button
                type="button"
                disabled={disabled}
                onClick={() => makeCover(slot.id)}
                className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px]"
              >
                <Star className="size-3" />
                Make cover
              </button>
            )}

            <button
              type="button"
              aria-label="Remove photo"
              disabled={disabled}
              onClick={() => remove(slot.id)}
              className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
            >
              <X className="size-3" />
            </button>
          </div>
        );
      })}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={handleSelect}
      />
    </div>
  );
}
