import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { Button } from "./ui/button";
import { Cart } from "./Cart";
import { SearchComponent } from "./SearchComponent";
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
        : role === "buyer"
          ? { href: "/seller/onboarding", label: "Become a Seller" }
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
    // Full-width navy bar; the content inside stays within the max width
    <header className="w-full bg-navy text-white">
      <MaxWidthWrapper className="flex h-16 w-full flex-row items-center justify-between gap-2 px-4">
        {/* Logo + Mobile Menu */}
        <div className="flex h-full w-full flex-row items-center justify-between gap-2 md:w-auto">
          <Link
            href="/"
            className="flex flex-row items-center gap-2 text-lg font-semibold tracking-tight text-white"
          >
            <Image
              src="/logo.png"
              alt="HubConnect Logo"
              width={400}
              height={300}
              priority
            />
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

          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/orders">Orders</Link>
          </Button>

          {roleLink && (
            <Button
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href={roleLink.href}>{roleLink.label}</Link>
            </Button>
          )}

          {user ? (
            userDialog
          ) : (
            <div className="flex flex-row items-center gap-4">
              <Button variant="secondary">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button className="bg-gold text-navy hover:bg-gold/90">
                <Link href="/auth/sign-up">Register</Link>
              </Button>
            </div>
          )}
        </nav>
      </MaxWidthWrapper>
    </header>
  );
};
