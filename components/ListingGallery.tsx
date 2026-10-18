"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ListingGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = React.useState(0);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm">
        {images[active] && (
          <Image
            src={images[active]}
            alt={alt}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative size-20 overflow-hidden rounded-lg bg-muted ring-offset-2",
                i === active && "ring-2 ring-primary",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
