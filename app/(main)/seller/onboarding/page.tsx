import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { SellerApplicationForm } from "@/components/SellerApplicationForm";
import { Button } from "@/components/ui/button";

export default function SellerOnboardingPage() {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        </MaxWidthWrapper>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

async function OnboardingContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded) redirect("/onboarding");
  if (profile.role === "seller" || profile.role === "admin")
    redirect("/seller");

  const [{ data: latest }, { data: categories }] = await Promise.all([
    supabase
      .from("seller_applications")
      .select("id, business_name, status, admin_note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  // Application waiting for review
  if (latest?.status === "pending") {
    return (
      <MaxWidthWrapper className="w-full max-w-md space-y-5 py-20 text-center">
        <Clock3 className="mx-auto size-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Application under review</h1>
        <p className="text-muted-foreground">
          We got your application for <strong>{latest.business_name}</strong> on{" "}
          {formatDate(latest.created_at)}. The team will review it soon, and
          once it's approved the Seller Dashboard appears in your menu.
        </p>
        <Link href="/">
          <Button variant="outline">Back to marketplace</Button>
        </Link>
      </MaxWidthWrapper>
    );
  }

  return (
    <MaxWidthWrapper className="w-full max-w-lg space-y-6 py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Become a seller</h1>
        <p className="text-sm text-muted-foreground">
          Tell us what you want to sell on HubConnect. The team reviews every
          application before you can post listings.
        </p>
      </div>

      {latest?.status === "rejected" && (
        <div className="space-y-1 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-destructive">
            Your last application wasn't approved
          </p>
          <p className="text-muted-foreground">
            {latest.admin_note || "No reason was given."} You can apply again
            below.
          </p>
        </div>
      )}

      <SellerApplicationForm categories={categories ?? []} />
    </MaxWidthWrapper>
  );
}
