import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero({ sellHref }: { sellHref: string }) {
  return (
    // bg-navy (not bg-primary) so the hero stays navy in dark mode too
    <section className="w-full bg-navy text-white">
      <MaxWidthWrapper className="grid items-center gap-10 py-12 lg:grid-cols-[1.5fr_1fr] lg:py-16">
        <div className="space-y-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
            Eduvos Incubation Hub Marketplace
          </p>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Shop student businesses
            <span className="block italic text-gold">
              right here on campus.
            </span>
          </h1>

          <p className="max-w-lg text-sm leading-relaxed text-white/90 sm:text-base">
            Handmade, homemade and second-hand – from Eduvos students, with
            payment held safely until you get your item.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/marketplace"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-gold px-6 font-semibold text-navy hover:bg-gold/90",
              )}
            >
              Start shopping
            </Link>
            <Link
              href={sellHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/80 bg-transparent px-6 font-semibold text-white hover:bg-white/10 hover:text-white",
              )}
            >
              Sell something
            </Link>
          </div>
        </div>

        {/* Photo card with the offset block behind it */}
        <div className="relative mx-auto w-full max-w-sm pb-3 pr-3 lg:ml-auto lg:mr-0">
          <div
            aria-hidden
            className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-gold"
          />
          <div className="relative aspect-[8/7] overflow-hidden rounded-2xl bg-white/10">
            <Image
              src="/hero.jpg"
              alt="A smiling Eduvos student seller"
              fill
              priority
              sizes="(min-width: 1024px) 28vw, 90vw"
              className="object-cover"
            />
          </div>

          <div className="absolute -left-2 bottom-7 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-navy shadow-md sm:-left-8">
            <span className="grid size-4 place-items-center rounded-full bg-navy">
              <Check className="size-2.5 text-white" strokeWidth={3} />
            </span>
            Verified Eduvos sellers
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
