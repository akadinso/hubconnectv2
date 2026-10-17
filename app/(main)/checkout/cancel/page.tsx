import Link from "next/link";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Button } from "@/components/ui/button";

export default function CancelPage() {
  return (
    <MaxWidthWrapper className="w-full max-w-md space-y-5 py-20 text-center">
      <h1 className="text-2xl font-bold">Payment cancelled</h1>
      <p className="text-muted-foreground">
        You haven't been charged, and your cart is still saved.
      </p>
      <Link href="/checkout">
        <Button>Back to checkout</Button>
      </Link>
    </MaxWidthWrapper>
  );
}
