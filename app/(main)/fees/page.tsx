import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { rand } from "@/lib/format";
import {
  buyerFeeLabel,
  getFees,
  pct,
  weeklySellerFees,
  type PlatformFees,
} from "@/lib/fees";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";

export default function FeesPage() {
  return (
    <Suspense
      fallback={
        <MaxWidthWrapper className="w-full py-10">Loading...</MaxWidthWrapper>
      }
    >
      <FeesContent />
    </Suspense>
  );
}

function Example({
  title,
  weeks,
  fees,
}: {
  title: string;
  weeks: number[];
  fees: PlatformFees;
}) {
  const charged = weeklySellerFees(weeks, fees);
  const sales = weeks.reduce((a, b) => a + b, 0);
  const paid = charged.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="font-semibold">{title}</p>
      <table className="w-full text-sm">
        <tbody>
          {weeks.map((s, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-1.5 text-muted-foreground">Week {i + 1}</td>
              <td className="py-1.5">sells {rand(s)}</td>
              <td className="py-1.5 text-right">pays {rand(charged[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm">
        Fees for the month: <strong>{rand(paid)}</strong>. Takes home{" "}
        <strong>{rand(sales - paid)}</strong>.
      </p>
    </div>
  );
}

async function FeesContent() {
  const supabase = await createClient();
  const fees = await getFees(supabase);

  const exampleItem = 300;
  const exampleFee =
    Math.round((fees.buyerFixed + fees.buyerRate * exampleItem) * 100) / 100;

  return (
    <MaxWidthWrapper className="w-full max-w-3xl space-y-10 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">How fees work</h1>
        <p className="text-muted-foreground">
          Simple, fair and the same for everyone. Listing is free, and sellers
          only pay when they sell.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">For sellers</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          <li>
            Listing is <strong>free, always</strong>.
          </li>
          <li>
            You pay <strong>{pct(fees.sellerRate)}</strong> of what you sell,
            but{" "}
            <strong>
              never more than {rand(fees.sellerMonthlyCap)} a month
            </strong>
            .
          </li>
          <li>Sell nothing, pay nothing.</li>
          <li>
            You never get a bill. The fee comes off your payouts automatically.
          </li>
          <li>
            You're paid out every week. Once your fees for the month reach the
            cap, we take nothing more until the 1st.
          </li>
        </ul>
        <div className="grid gap-4 sm:grid-cols-2">
          <Example
            title="A small seller"
            weeks={[100, 150, 0, 250]}
            fees={fees}
          />
          <Example
            title="A busy seller"
            weeks={[1000, 1000, 1000, 1000]}
            fees={fees}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">For buyers</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          <li>
            A small protection fee at checkout (about{" "}
            <strong>{buyerFeeLabel(fees)}</strong>), paid by the buyer and never
            by the seller.
          </li>
          <li>
            It covers the payment processing fees. In return, your money is held
            until you get your item.
          </li>
          <li>
            Example: a {rand(exampleItem)} item adds {rand(exampleFee)}, so you
            pay {rand(exampleItem + exampleFee)}.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          All payments stay on HubConnect
        </h2>
        <p className="text-sm text-muted-foreground">
          Even when you meet on campus, the payment is made through HubConnect.
          That's what protects the buyer and keeps every order tracked. Payments
          made outside HubConnect aren't protected.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Coming later</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>
            Optional paid featured listings for extra visibility (about R20 a
            week).
          </li>
          <li>
            Business of the Month is <strong>not paid</strong>. The Incubation
            Hub picks the top seller on the sales leaderboard each month and
            gives them a spotlight on the home page.
          </li>
        </ul>
      </section>
    </MaxWidthWrapper>
  );
}
