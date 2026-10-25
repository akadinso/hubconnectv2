import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { ProfileForm } from "@/components/ProfileForm";
import { ShopSettingsForm } from "@/components/ShopSettingsForm";
import { Button } from "@/components/ui/button";

export default function EditProfilePage() {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </MaxWidthWrapper>
      }
    >
      <EditContent />
    </Suspense>
  );
}

async function EditContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: campuses }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, username, bio, avatar_url, role, campus_id, shop_name, tagline, shop_tags, expected_graduation",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("campuses")
      .select("id, name")
      .eq("active", true)
      .order("name"),
  ]);

  const isSeller = profile?.role === "seller" || profile?.role === "admin";

  return (
    <MaxWidthWrapper className="w-full max-w-5xl space-y-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Edit profile</h1>
          <p className="text-sm text-muted-foreground">
            Update how you appear on HubConnect.
          </p>
        </div>
        {profile?.username && (
          <Link href={`/profile/${profile.username}`}>
            <Button variant="outline">View public profile</Button>
          </Link>
        )}
      </div>

      <ProfileForm
        userId={user.id}
        email={user.email ?? ""}
        campuses={campuses ?? []}
        initial={{
          fullName: profile?.full_name ?? "",
          username: profile?.username ?? "",
          bio: profile?.bio ?? "",
          avatarUrl: profile?.avatar_url ?? null,
          campusId: profile?.campus_id ?? "",
        }}
      />

      {isSeller && (
        <ShopSettingsForm
          initial={{
            shopName: profile?.shop_name ?? "",
            tagline: profile?.tagline ?? "",
            tags: profile?.shop_tags ?? [],
            expectedGraduation: profile?.expected_graduation ?? "",
          }}
        />
      )}
    </MaxWidthWrapper>
  );
}
