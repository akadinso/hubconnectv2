"use client";

import * as React from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export type ListingSummary = {
  id: string;
  title: string;
  price: number | null;
  image: string | null;
};
export type CartLine = ListingSummary & { quantity: number };

type StoreValue = {
  loading: boolean;
  cart: CartLine[];
  favourites: ListingSummary[];
  cartCount: number;
  cartTotal: number;
  isFavourite: (id: string) => boolean;
  addToCart: (listing: ListingSummary, qty?: number) => Promise<void>;
  setQuantity: (id: string, quantity: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  toggleFavourite: (listing: ListingSummary) => Promise<void>;
  clearFavourites: () => Promise<void>;
  addAllFavouritesToCart: () => Promise<void>;
};

const StoreContext = React.createContext<StoreValue | null>(null);

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

const LISTING = "listing:listings ( id, title, price, image_url )";

function toSummary(row: any): ListingSummary | null {
  const l = Array.isArray(row?.listing) ? row.listing[0] : row?.listing;
  if (!l) return null; // listing was archived or deleted
  return {
    id: l.id,
    title: l.title,
    price: l.price != null ? Number(l.price) : null,
    image: l.image_url ?? null,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const supabase = React.useMemo(() => createClient(), []);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [favourites, setFavourites] = React.useState<ListingSummary[]>([]);
  const lastUid = React.useRef<string | null | undefined>(undefined);

  const load = React.useCallback(
    async (uid: string | null) => {
      if (!uid) {
        setCart([]);
        setFavourites([]);
        setLoading(false);
        return;
      }

      const [cartRes, favRes] = await Promise.all([
        supabase
          .from("cart_items")
          .select(`quantity, ${LISTING}`)
          .order("created_at"),
        supabase
          .from("favourites")
          .select(LISTING)
          .order("created_at", { ascending: false }),
      ]);

      setCart(
        (cartRes.data ?? []).flatMap((row: any) => {
          const s = toSummary(row);
          return s ? [{ ...s, quantity: row.quantity as number }] : [];
        }),
      );
      setFavourites(
        (favRes.data ?? []).flatMap((row: any) => {
          const s = toSummary(row);
          return s ? [s] : [];
        }),
      );
      setLoading(false);
    },
    [supabase],
  );

  // Load on mount and whenever the signed-in user actually changes
  React.useEffect(() => {
    function sync(uid: string | null) {
      if (lastUid.current === uid) return; // ignore token refreshes
      lastUid.current = uid;
      setUserId(uid);
      load(uid);
    }

    supabase.auth.getUser().then(({ data }) => sync(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      sync(session?.user?.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, [supabase, load]);

  function requireUser() {
    if (!userId) {
      toast.error("Sign in to use your cart and favourites");
      return null;
    }
    return userId;
  }

  const removeFromCart = async (id: string) => {
    const uid = requireUser();
    if (!uid) return;
    setCart((prev) => prev.filter((l) => l.id !== id));
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", uid)
      .eq("listing_id", id);
    if (error) {
      toast.error(error.message);
      load(uid);
    }
  };

  const setQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(id);
    const uid = requireUser();
    if (!uid) return;
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, quantity } : l)));
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("user_id", uid)
      .eq("listing_id", id);
    if (error) {
      toast.error(error.message);
      load(uid);
    }
  };

  const addToCart = async (listing: ListingSummary, qty = 1) => {
    const uid = requireUser();
    if (!uid) return;
    const existing = cart.find((l) => l.id === listing.id);
    const quantity = (existing?.quantity ?? 0) + qty;

    setCart((prev) =>
      existing
        ? prev.map((l) => (l.id === listing.id ? { ...l, quantity } : l))
        : [...prev, { ...listing, quantity }],
    );

    const { error } = await supabase
      .from("cart_items")
      .upsert(
        { user_id: uid, listing_id: listing.id, quantity },
        { onConflict: "user_id,listing_id" },
      );
    if (error) {
      toast.error(error.message);
      load(uid);
    } else {
      toast.success(`${listing.title} added to cart`);
    }
  };

  const toggleFavourite = async (listing: ListingSummary) => {
    const uid = requireUser();
    if (!uid) return;
    const isFav = favourites.some((f) => f.id === listing.id);

    setFavourites((prev) =>
      isFav ? prev.filter((f) => f.id !== listing.id) : [listing, ...prev],
    );

    const { error } = isFav
      ? await supabase
          .from("favourites")
          .delete()
          .eq("user_id", uid)
          .eq("listing_id", listing.id)
      : await supabase
          .from("favourites")
          .insert({ user_id: uid, listing_id: listing.id });

    if (error) {
      toast.error(error.message);
      load(uid);
    }
  };

  const clearFavourites = async () => {
    const uid = requireUser();
    if (!uid) return;
    setFavourites([]);
    const { error } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", uid);
    if (error) {
      toast.error(error.message);
      load(uid);
    }
  };

  // Adds favourites that aren't in the cart yet (quantity 1 each)
  const addAllFavouritesToCart = async () => {
    const uid = requireUser();
    if (!uid) return;
    const missing = favourites.filter((f) => !cart.some((c) => c.id === f.id));
    if (missing.length === 0) {
      toast.info("Everything is already in your cart");
      return;
    }

    setCart((prev) => [
      ...prev,
      ...missing.map((m) => ({ ...m, quantity: 1 })),
    ]);
    const { error } = await supabase
      .from("cart_items")
      .insert(
        missing.map((m) => ({ user_id: uid, listing_id: m.id, quantity: 1 })),
      );
    if (error) {
      toast.error(error.message);
      load(uid);
    } else {
      toast.success(`${missing.length} item(s) added to cart`);
    }
  };

  const value = React.useMemo<StoreValue>(
    () => ({
      loading,
      cart,
      favourites,
      cartCount: cart.reduce((sum, l) => sum + l.quantity, 0),
      cartTotal: cart.reduce((sum, l) => sum + (l.price ?? 0) * l.quantity, 0),
      isFavourite: (id) => favourites.some((f) => f.id === id),
      addToCart,
      setQuantity,
      removeFromCart,
      toggleFavourite,
      clearFavourites,
      addAllFavouritesToCart,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, cart, favourites, userId],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
