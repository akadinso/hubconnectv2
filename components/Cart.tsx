"use client";

import * as React from "react";
import Link from "next/link";

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
import { DeleteIcon, ShoppingBasket, ShoppingCart, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStore } from "@/components/StoreProvider";

export function Cart() {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const { cart, cartCount, cartTotal, setQuantity, removeFromCart } =
    useStore();

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerTrigger
        render={
          <Button variant="default">
            <ShoppingCart />
            Cart
            {cartCount > 0 && <Badge className="ml-1">{cartCount}</Badge>}
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
          <DrawerTitle className="text-xl font-bold ">Cart</DrawerTitle>
          <Badge className="text-md">{cartCount}</Badge>
        </DrawerHeader>

        <div className="flex-1 space-y-4 overflow-y-auto scroll-fade">
          {cart.length >= 1 ? (
            cart.map((item) => (
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
                    <div className="flex flex-row items-center gap-2">
                      <Button
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8 rounded-full"
                      >
                        -
                      </Button>
                      <span>{item.quantity}</span>
                      <Button
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 rounded-full"
                      >
                        +
                      </Button>
                    </div>

                    <Button
                      variant="destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <DeleteIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-full w-full flex-row items-center justify-center gap-4">
              <ShoppingCart />
              <h1>No items in the cart.</h1>
            </div>
          )}
        </div>

        <DrawerFooter>
          <div className="mb-2 flex flex-row justify-between">
            <h1 className="text-lg font-bold">Subtotal:</h1>
            <span className="text-lg font-bold">R {cartTotal.toFixed(2)}</span>
          </div>

          {cart.length > 0 ? (
            <Link href="/checkout" onClick={() => setOpen(false)}>
              <Button className="w-full py-5 font-bold">
                <ShoppingBasket />
                Checkout
              </Button>
            </Link>
          ) : (
            <Button className="w-full py-5 font-bold" disabled>
              <ShoppingBasket />
              Checkout
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
