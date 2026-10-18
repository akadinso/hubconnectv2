"use client";

import * as React from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
      <SheetTrigger>
        <button
          aria-label="Open menu"
          className="flex items-center justify-center rounded-md p-2 text-white hover:bg-white/10 transition-colors"
        >
          <MenuIcon size={24} strokeWidth={1.5} />
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="flex flex-col gap-6 p-6">
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="text-lg font-bold">Menu</SheetTitle>
        </SheetHeader>

        <SearchComponent />

        <div className="flex flex-col items-start gap-3">
          <Favourites />
          <Cart />
        </div>

        <Link
          href="/orders"
          onClick={() => setOpen(false)}
          className={buttonVariants({
            variant: "ghost",
            className: "w-full justify-start text-sm font-medium",
          })}
        >
          Orders
        </Link>

        {roleLink && (
          <Link
            href={roleLink.href}
            onClick={() => setOpen(false)}
            className={buttonVariants({
              variant: "outline",
              className: "w-full justify-center text-sm font-medium",
            })}
          >
            {roleLink.label}
          </Link>
        )}

        {isUser ? (
          <div onClick={() => setOpen(false)} className="w-full">
            {userSlot}
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className={buttonVariants({
                variant: "secondary",
                className: "w-full justify-center text-sm font-medium",
              })}
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              onClick={() => setOpen(false)}
              className={buttonVariants({
                className:
                  "w-full justify-center bg-amber-400 text-[#11223f] hover:bg-amber-300 font-semibold text-sm",
              })}
            >
              Register
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
