"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { DeleteIcon, Heart, ShoppingCart, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStore } from "@/components/StoreProvider";

export function Favourites() {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const {
    favourites,
    toggleFavourite,
    clearFavourites,
    addToCart,
    addAllFavouritesToCart,
  } = useStore();

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerTrigger
        render={
          <Button variant="secondary">
            <Heart />
            Favourites
            {favourites.length > 0 && (
              <Badge className="ml-1">{favourites.length}</Badge>
            )}
          </Button>
        }
      />

      <DrawerContent>
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerClose
            render={
              <Button variant="ghost">
                <X />
              </Button>
            }
          />
          <DrawerTitle className="text-xl font-bold">Favourites</DrawerTitle>
          <Badge className="text-md">{favourites.length}</Badge>
        </DrawerHeader>

        <div className="flex-1 space-y-4 overflow-y-auto scroll-fade">
          {favourites.length >= 1 ? (
            favourites.map((item) => (
              <div
                className="m-4 flex flex-row rounded-xl border p-4"
                key={item.id}
              >
                <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="ml-4 flex w-full flex-col justify-center">
                  <span className="font-bold">{item.title}</span>
                  <span className="font-medium">
                    {item.price != null
                      ? `R${item.price.toFixed(2)}`
                      : "Price on request"}
                  </span>

                  <div className="mt-5 flex w-full flex-row items-center justify-between">
                    <Button size="sm" onClick={() => addToCart(item)}>
                      <ShoppingCart />
                      Add to cart
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() => toggleFavourite(item)}
                    >
                      <DeleteIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-full w-full flex-row items-center justify-center gap-4">
              <Heart />
              <h1>No favourites yet.</h1>
            </div>
          )}
        </div>

        {favourites.length > 0 && (
          <DrawerFooter>
            <Button
              onClick={clearFavourites}
              variant="outline"
              className="py-5 font-semibold"
            >
              Clear all
            </Button>
            <Button onClick={addAllFavouritesToCart} className="py-5 font-bold">
              <ShoppingCart />
              Add all to cart
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
