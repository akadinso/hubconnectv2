"use client";

import * as React from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
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
  userSlot,
}: {
  isUser: boolean;
  roleLink: { href: string; label: string } | null;
  userSlot: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <MenuIcon size={24} strokeWidth={1.5} />
          </Button>
        }
      />

      <SheetContent side="right" className="flex flex-col gap-6 p-6">
        <SheetHeader className="p-0">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <SearchComponent />

        <div className="flex flex-col items-start gap-3">
          <Favourites />
          <Cart />
        </div>

        {roleLink && (
          <Link href={roleLink.href} onClick={() => setOpen(false)}>
            <Button variant="outline" className="w-full">
              {roleLink.label}
            </Button>
          </Link>
        )}

        {isUser ? (
          userSlot
        ) : (
          <div className="flex flex-col gap-3">
            <Link href="/auth/login" onClick={() => setOpen(false)}>
              <Button variant="secondary" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up" onClick={() => setOpen(false)}>
              <Button className="w-full">Register</Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
