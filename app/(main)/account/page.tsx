import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, ShoppingBag, Sprout, Store } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { initialsOf } from "@/lib/format";
import { studentStatus } from "@/lib/marketplace-options";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { ProfileEditDialog } from "@/components/ProfileEditDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">
          <div className="h-28 w-full animate-pulse rounded-xl bg-muted" />
        </MaxWidthWrapper>
      }
    >
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, username, bio, avatar_url, role, shop_name, expected_graduation, created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  const isSeller = profile?.role === "seller" || profile?.role === "admin";
  const name =
    profile?.shop_name ||
    profile?.full_name ||
    profile?.username ||
    "Your account";

  const isNew =
    isSeller &&
    !!profile?.created_at &&
    Date.now() - new Date(profile.created_at).getTime() <
      30 * 24 * 60 * 60 * 1000;

  const student = studentStatus(profile?.expected_graduation);

  const tiles = [
    isSeller
      ? {
          href: "/seller/listings",
          icon: Store,
          title: "My Listings",
          text: "Manage what you're selling",
        }
      : {
          href: "/seller/onboarding",
          icon: Store,
          title: "Become a seller",
          text: "Apply to sell on HubConnect",
        },
    {
      href: "/orders",
      icon: ShoppingBag,
      title: "My Orders",
      text: "Buying and selling updates",
    },
    {
      href: "/grow",
      icon: Sprout,
      title: "Grow your business",
      text: "Guides, templates and incubation hub support",
    },
  ];

  return (
    <MaxWidthWrapper className="w-full max-w-4xl space-y-10 py-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar className="size-24 shrink-0">
          {profile?.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={name} />
          )}
          <AvatarFallback className="text-2xl">
            {initialsOf(name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="truncate text-2xl font-bold">{name}</h1>
          <div className="flex flex-wrap gap-2">
            {isNew && (
              <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                New Seller
              </Badge>
            )}
            <Badge className="bg-gold-lite text-gold-dark hover:bg-gold-lite">
              {student.label}
            </Badge>
          </div>
          {profile?.bio && (
            <p className="max-w-prose text-sm text-muted-foreground">
              {profile.bio}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <ProfileEditDialog
            userId={user.id}
            initial={{
              fullName: profile?.full_name ?? "",
              bio: profile?.bio ?? "",
              avatarUrl: profile?.avatar_url ?? null,
            }}
            trigger={
              <Button variant="outline" type="button">
                Edit profile
              </Button>
            }
          />
          {profile?.username && (
            <Link href={`/profile/${profile.username}`}>
              <Button variant="ghost">View public profile</Button>
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ href, icon: Icon, title, text }) => (
          <Link
            key={title}
            href={href}
            className="group flex items-center gap-3 rounded-xl bg-muted/60 p-4 transition-colors hover:bg-muted"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-gold-lite text-gold-dark">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-xs text-muted-foreground">
                {text}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Need to change your username or shop details?{" "}
        <Link href="/settings/profile" className="underline underline-offset-4">
          More settings
        </Link>
      </p>
    </MaxWidthWrapper>
  );
}
