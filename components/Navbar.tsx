import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { Button } from "./ui/button";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { Cart } from "./Cart";
import { SearchComponent } from "./SearchComponent";
import { createClient } from "@/lib/supabase/server";
import { UserDialog } from "./UserDialog";
import { Favourites } from "./Favourite";
import { MobileMenu } from "./MobileMenu";
{
  /**import { NotificationsBell } from "./NotificationsBell";*/
}

type Role = "buyer" | "seller" | "admin";

export const Navbar = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: Role | null = null;
  let fullName: string | null = null;
  let username: string | null = null;
  let avatarUrl: string | null = null;
  let applicationPending = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    role = (profile?.role as Role | undefined) ?? null;
    fullName = profile?.full_name ?? null;
    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;

    if (role === "buyer") {
      const { count } = await supabase
        .from("seller_applications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");
      applicationPending = (count ?? 0) > 0;
    }
  }

  const roleLink =
    role === "seller"
      ? { href: "/seller", label: "Seller Dashboard" }
      : role === "admin"
        ? { href: "/admin", label: "Admin" }
        : null;

  const sellHref =
    role === "seller" || role === "admin"
      ? "/seller/listings/new"
      : "/seller/onboarding";

  const userDialog = user ? (
    <UserDialog
      fullName={fullName}
      username={username}
      avatarUrl={avatarUrl}
      role={role}
      applicationPending={applicationPending}
    />
  ) : null;

  const iconBtn = "text-white hover:bg-white/10 hover:text-white";

  return (
    <header className="w-full bg-navy text-white print:hidden">
      <MaxWidthWrapper className="flex h-16 items-center gap-3 xl:gap-6">
        <Link
          href="/"
          className="shrink-0 text-lg font-semibold tracking-tight text-white"
        >
          HubConnect
        </Link>

        {/* Search: from tablets up (on phones it lives in the menu) */}
        <div className="hidden min-w-0 flex-1 md:block">
          <div className="mx-auto max-w-xl">
            <SearchComponent />
          </div>
        </div>

        {/* Wide screens: the full navigation */}
        <nav className="hidden shrink-0 items-center gap-2 xl:flex">
          <Favourites />
          <Cart />

          {user ? (
            <>
              <Link href="/orders">
                <Button variant="ghost" className={iconBtn}>
                  Orders
                </Button>
              </Link>
              <Link href="/messages" aria-label="Messages">
                <Button variant="ghost" size="icon" className={iconBtn}>
                  <MessageCircle className="size-5" />
                </Button>
              </Link>
              {/*} <NotificationsBell supabase={supabase} userId={user.id} />*/}
              {roleLink && (
                <Link href={roleLink.href}>
                  <Button
                    variant="outline"
                    className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    {roleLink.label}
                  </Button>
                </Link>
              )}
              <Link href={sellHref}>
                <Button className="bg-gold text-navy hover:bg-gold/90">
                  + Sell something
                </Button>
              </Link>
              {userDialog}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="secondary">Sign In</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button className="bg-gold text-navy hover:bg-gold/90">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Phones, tablets and small laptops */}
        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0 xl:hidden">
          {user && <NotificationsBell supabase={supabase} userId={user.id} />}
          <MobileMenu
            isUser={!!user}
            roleLink={roleLink}
            sellHref={sellHref}
            userSlot={userDialog}
          />
        </div>
      </MaxWidthWrapper>
    </header>
  );
};
