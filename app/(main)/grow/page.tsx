import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { GUIDES, HELP } from "@/lib/grow-content";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GrowPage() {
  return (
    <Suspense fallback={<MaxWidthWrapper className="w-full py-10" >Loading...</MaxWidthWrapper>}>
      <GrowContent />
    </Suspense>
  );
}

async function GrowContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <MaxWidthWrapper className="w-full max-w-4xl space-y-8 py-8">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft className="size-4" />
        Back to account
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Grow your business</h1>
        <p className="text-sm text-muted-foreground">
          Practical guides to help you price, plan and promote what you sell.
        </p>
      </div>

      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((g) => (
          <details
            key={g.title}
            className="group rounded-xl border bg-card p-4"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-2 [&::-webkit-details-marker]:hidden">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{g.title}</p>
                <p className="text-xs text-muted-foreground">{g.summary}</p>
              </div>
              <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
              {g.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Need more help?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {HELP.map((h) => (
            <div key={h.title} className="space-y-3 rounded-xl border p-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{h.title}</p>
                <p className="text-xs text-muted-foreground">{h.text}</p>
              </div>
              <a
                href={h.href}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                {h.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        This is general guidance, not financial or legal advice.
      </p>
    </MaxWidthWrapper>
  );
}
