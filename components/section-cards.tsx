import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { rand } from "@/lib/format";

export function SectionCards({
  users,
  totalListings,
  salesVolume,
  platformFees,
  paidOrders,
}: {
  users: { role: string }[];
  totalListings: number;
  salesVolume: number;
  platformFees: number;
  paidOrders: number;
}) {
  const sellers = users.filter((u) => u.role === "seller").length;

  const cards = [
    {
      label: "Sales volume",
      value: rand(salesVolume),
      hint: `${paidOrders} paid ${paidOrders === 1 ? "order" : "orders"}`,
    },
    {
      label: "Platform fees",
      value: rand(platformFees),
      hint: "Buyer protection and seller fees",
    },
    { label: "Users", value: String(users.length), hint: `${sellers} sellers` },
    {
      label: "Listings",
      value: String(totalListings),
      hint: "Across all campuses",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:px-6 xl:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader>
            <CardDescription>{c.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {c.value}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{c.hint}</p>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
