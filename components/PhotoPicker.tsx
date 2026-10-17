"use client";

import * as React from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_PHOTOS, validatePhoto } from "@/lib/upload-photos";

export function PhotoPicker({
  files,
  onChange,
  max = MAX_PHOTOS,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  max?: number;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  const previews = React.useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files],
  );
  React.useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews],
  );

  if (max <= 0) {
    return (
      <p className="text-xs text-muted-foreground">
        This review already has the maximum number of photos.
      </p>
    );
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    setError(null);

    const next = [...files];
    for (const file of picked) {
      if (next.length >= max) {
        setError(`You can add up to ${max} photo${max > 1 ? "s" : ""}.`);
        break;
      }
      const problem = validatePhoto(file);
      if (problem) {
        setError(problem);
        continue;
      }
      next.push(file);
    }
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {previews.map((src, i) => (
          <div
            key={src}
            className="relative size-16 overflow-hidden rounded-lg border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Selected photo ${i + 1}`}
              className="size-full object-cover"
            />
            <button
              type="button"
              aria-label="Remove photo"
              disabled={disabled}
              onClick={() => onChange(files.filter((_, idx) => idx !== i))}
              className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        {files.length < max && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="size-16 flex-col gap-0.5 text-[10px]"
          >
            <ImagePlus className="size-5" />
            Add
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={handleSelect}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
