import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { ProfileForm } from "@/components/ProfileForm";
import { ShopSettingsForm } from "@/components/ShopSettingsForm";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, username, bio, avatar_url, role, shop_name, tagline, shop_tags, expected_graduation",
    )
    .eq("id", user.id)
    .maybeSingle();

  const isSeller = profile?.role === "seller" || profile?.role === "admin";

  return (
    <MaxWidthWrapper className="w-full max-w-lg space-y-8 py-10">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Edit profile</h1>
        <ProfileForm
          userId={user.id}
          email={user.email ?? ""}
          initial={{
            fullName: profile?.full_name ?? "",
            username: profile?.username ?? "",
            bio: profile?.bio ?? "",
            avatarUrl: profile?.avatar_url ?? null,
          }}
        />
      </div>

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
