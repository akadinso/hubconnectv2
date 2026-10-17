import { cn } from "@/lib/utils";

export function PhotoGrid({
  urls,
  className,
}: {
  urls: string[];
  className?: string;
}) {
  if (urls.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {urls.map((url, i) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="block size-20 overflow-hidden rounded-lg border bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Photo ${i + 1}`}
            loading="lazy"
            className="size-full object-cover"
          />
        </a>
      ))}
    </div>
  );
}
