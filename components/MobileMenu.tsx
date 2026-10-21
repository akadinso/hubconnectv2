"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, MessageCircle, Package, Plus, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SearchComponent } from "./SearchComponent";
import { Cart } from "./Cart";
import { Favourites } from "./Favourite";

export function MobileMenu({
  isUser,
  roleLink,
  sellHref,
  userSlot,
}: {
  isUser: boolean;
  roleLink: { href: string; label: string } | null;
  sellHref: string;
  userSlot: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [lastPath, setLastPath] = React.useState(pathname);

  // Close the menu whenever the page changes, whatever caused it
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const linkClass = "w-full justify-start gap-2";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <MenuIcon size={24} strokeWidth={1.5} />
          </Button>
        }
      />

      <SheetContent
        side="right"
        className="flex flex-col gap-5 overflow-y-auto p-6"
      >
        <SheetHeader className="p-0">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <SearchComponent />

        <div className="flex flex-col items-start gap-3">
          <Favourites />
          <Cart />
        </div>

        {isUser ? (
          <nav className="flex flex-col gap-1">
            <Link href="/messages">
              <Button variant="ghost" className={linkClass}>
                <MessageCircle className="size-4" />
                Messages
              </Button>
            </Link>
            <Link href="/orders">
              <Button variant="ghost" className={linkClass}>
                <Package className="size-4" />
                Orders
              </Button>
            </Link>
            <Link href="/account">
              <Button variant="ghost" className={linkClass}>
                <User className="size-4" />
                My account
              </Button>
            </Link>
            {roleLink && (
              <Link href={roleLink.href}>
                <Button variant="outline" className="mt-2 w-full">
                  {roleLink.label}
                </Button>
              </Link>
            )}
            <Link href={sellHref}>
              <Button className="mt-2 w-full gap-1 bg-gold text-navy hover:bg-gold/90">
                <Plus className="size-4" />
                Sell something
              </Button>
            </Link>
          </nav>
        ) : (
          <div className="flex flex-col gap-3">
            <Link href="/auth/login">
              <Button variant="secondary" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="w-full">Register</Button>
            </Link>
          </div>
        )}

        {isUser && userSlot}
      </SheetContent>
    </Sheet>
  );
}
