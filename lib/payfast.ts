import crypto from "node:crypto";

const sandbox = process.env.PAYFAST_SANDBOX !== "false";
const host = sandbox ? "sandbox.payfast.co.za" : "www.payfast.co.za";

export const PAYFAST_PROCESS_URL = `https://${host}/eng/process`;
export const PAYFAST_VALIDATE_URL = `https://${host}/eng/query/validate`;

export type Pair = [string, string];

// Matches PHP's urlencode(): uppercase hex, "+" for spaces
function encode(value: string) {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

export function paramString(pairs: Pair[]) {
  return pairs.map(([k, v]) => `${k}=${encode(v)}`).join("&");
}

export function sign(pairs: Pair[], passphrase?: string) {
  let str = paramString(pairs);
  if (passphrase?.trim()) str += `&passphrase=${encode(passphrase.trim())}`;
  return crypto.createHash("md5").update(str).digest("hex");
}

export function buildCheckout(opts: {
  orderId: string;
  total: number;
  email: string;
}) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const notifyUrl =
    process.env.PAYFAST_NOTIFY_URL ?? `${site}/api/payfast/notify`;

  // Order matters: this is PayFast's documented field order, not alphabetical
  const pairs: Pair[] = (
    [
      ["merchant_id", process.env.PAYFAST_MERCHANT_ID!],
      ["merchant_key", process.env.PAYFAST_MERCHANT_KEY!],
      ["return_url", `${site}/checkout/success?order=${opts.orderId}`],
      ["cancel_url", `${site}/checkout/cancel`],
      ["notify_url", notifyUrl],
      ["email_address", opts.email],
      ["m_payment_id", opts.orderId],
      ["amount", opts.total.toFixed(2)],
      ["item_name", `HubConnect order ${opts.orderId.slice(0, 8)}`],
      ["item_description", "Eduvos Incubator marketplace purchase"],
    ] as Pair[]
  )
    .map(([k, v]): Pair => [k, v.trim()])
    .filter(([, v]) => v !== ""); // empty fields must not be sent or signed

  const signature = sign(pairs, process.env.PAYFAST_PASSPHRASE);

  return {
    action: PAYFAST_PROCESS_URL,
    fields: { ...Object.fromEntries(pairs), signature } as Record<string, string>,
  };
}