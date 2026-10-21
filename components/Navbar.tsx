import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { Button, buttonVariants } from "./ui/button";
import { Cart } from "./Cart";
import { SearchComponent } from "./SearchComponent";
import { UserDialog } from "./UserDialog";
import { Favourites } from "./Favourite";
import { MobileMenu } from "./MobileMenu";
import { MessageCircle } from "lucide-react";

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
    if (role === "buyer") {
      const { count } = await supabase
        .from("seller_applications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");
      applicationPending = (count ?? 0) > 0;
    }
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
      applicationPending={applicationPending}
    />
  ) : null;

  const sellHref =
    role === "seller" || role === "admin"
      ? "/seller/listings/new"
      : "/seller/onboarding";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#11223f] text-white shadow-sm">
      <MaxWidthWrapper className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:h-20">
        {/* Logo & Mobile Menu */}
        <div className="flex h-full w-full items-center justify-between gap-2 md:w-auto md:justify-start">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-white shrink-0"
          >
            <Image
              src="/logo.png"
              alt="HubConnect Logo"
              width={160}
              height={48}
              priority
              className="h-auto w-32 object-contain sm:w-40"
            />
          </Link>

          <div className="shrink-0 md:hidden">
            <MobileMenu
              isUser={!!user}
              roleLink={roleLink}
              sellHref={sellHref}
              userSlot={userDialog}
            />
          </div>
        </div>

        {/* Search Input */}
        <div className="mx-2 hidden w-full max-w-md shrink md:block lg:mx-8 lg:max-w-xl">
          <SearchComponent />
        </div>

        {/* Navigation Items */}
        <nav className="hidden shrink-0 items-center gap-4 md:flex lg:gap-6">
          <div className="flex items-center gap-2 lg:gap-3">
            <Favourites />
            <Cart />
          </div>

          <Link
            href="/orders"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className:
                "text-xs font-medium text-white hover:bg-white/10 hover:text-white",
            })}
          >
            Orders
          </Link>

          {user && (
            <>
              <Link href="/messages" aria-label="Messages">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  <MessageCircle className="size-5" />
                </Button>
              </Link>
              <Link href={sellHref}>
                <Button className="bg-gold text-navy hover:bg-gold/90">
                  + Sell something
                </Button>
              </Link>
            </>
          )}

          {roleLink && (
            <Link
              href={roleLink.href}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "border-white/30 bg-transparent text-xs font-medium text-white hover:bg-white/10 hover:text-white",
              })}
            >
              {roleLink.label}
            </Link>
          )}

          {user ? (
            userDialog
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                  className: "text-xs",
                })}
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className={buttonVariants({
                  size: "sm",
                  className:
                    "bg-amber-400 text-xs text-[#11223f] hover:bg-amber-300 font-semibold",
                })}
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </MaxWidthWrapper>
    </header>
  );
};
