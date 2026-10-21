"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { releaseWithCode } from "@/app/(main)/orders/actions";

export function CodeEntry({ itemId }: { itemId: string }) {
  const router = useRouter();
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = React.useState(["", "", "", ""]);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const code = digits.join("");

  function setAt(i: number, value: string) {
    const d = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => prev.map((x, idx) => (idx === i ? d : x)));
    if (d && i < 3) refs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      refs.current[i - 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!text) return;
    e.preventDefault();
    setDigits(
      text
        .padEnd(4, " ")
        .split("")
        .map((c) => (c === " " ? "" : c)),
    );
    refs.current[Math.min(text.length, 3)]?.focus();
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await releaseWithCode(itemId, code);
      if (result.error) {
        setError(result.error);
        setDigits(["", "", "", ""]);
        refs.current[0]?.focus();
        return;
      }
      toast.success("Code confirmed. Your payment has been released.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            aria-label={`Digit ${i + 1}`}
            disabled={pending}
            onChange={(e) => setAt(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            className="h-14 w-11 rounded-lg border bg-background text-center text-2xl font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        ))}
      </div>

      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      <Button
        className="w-full"
        onClick={submit}
        disabled={pending || code.length < 4}
      >
        {pending ? "Checking..." : "Confirm & release payment"}
      </Button>
    </div>
  );
}
