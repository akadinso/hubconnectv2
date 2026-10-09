import Link from "next/link";
import { Button } from "./ui/button";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { Cart } from "./Cart";
import { SearchComponent } from "./SearchComponent";
import { createClient } from "@/lib/supabase/server";
import { UserDialog } from "./UserDialog";
import { Favourites } from "./Favourite";
import { MobileMenu } from "./MobileMenu";

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
  }

  const roleLink =
    role === "seller"
      ? { href: "/seller", label: "Seller Dashboard" }
      : role === "admin"
        ? { href: "/admin", label: "Admin" }
        : null;

  const userDialog = user ? (
    <UserDialog
      fullName={fullName}
      username={username}
      avatarUrl={avatarUrl}
      role={role}
    />
  ) : null;

  return (
    <MaxWidthWrapper className="flex h-16 w-full flex-row items-center justify-between gap-2 px-4 dark:bg-white bg-dark">
      {/* Logo + Mobile Menu */}
      <div className="flex h-full w-full flex-row items-center justify-between gap-2 md:w-auto">
        <Link
          href="/"
          className="flex flex-row items-center gap-2 text-lg font-semibold tracking-tight"
        >
          HubConnect
        </Link>

        <div className="md:hidden">
          <MobileMenu
            isUser={!!user}
            roleLink={roleLink}
            userSlot={userDialog}
          />
        </div>
      </div>

      {/* Search */}
      <div className="mx-5 hidden w-full md:mx-40 md:block">
        <SearchComponent />
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden items-center gap-8 md:flex">
        <div className="flex flex-row items-center gap-3">
          <Favourites />
          <Cart />
        </div>

        {roleLink && (
          <Link href={roleLink.href}>
            <Button variant="outline">{roleLink.label}</Button>
          </Link>
        )}

        {user ? (
          userDialog
        ) : (
          <div className="flex flex-row items-center gap-4">
            <Link href="/auth/login">
              <Button variant="secondary">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button variant="default">Register</Button>
            </Link>
          </div>
        )}
      </nav>
    </MaxWidthWrapper>
  );
};
