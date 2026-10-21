export function HandoverCode({ code }: { code: string }) {
  return (
    <div
      className="flex justify-center gap-2"
      role="img"
      aria-label={`Handover code ${code.split("").join(" ")}`}
    >
      {code.split("").map((d, i) => (
        <span
          key={i}
          className="grid h-14 w-11 place-items-center rounded-lg border bg-background text-2xl font-bold tabular-nums"
        >
          {d}
        </span>
      ))}
    </div>
  );
}

export function handoverHint(delivery: string | null | undefined) {
  if (delivery === "courier") {
    return "When your courier delivery arrives and you're happy with the item, share this code with the seller in the chat so they can release your payment.";
  }
  if (delivery === "campus") {
    return "Meet the seller and check your item first. Once you're happy, show them this code so they can release your payment.";
  }
  return "Once you've received and checked your item, give the seller this code so they can release your payment.";
}

export const DELIVERY_LABEL: Record<string, string> = {
  campus: "Meet on campus",
  courier: "Courier delivery",
};
