import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

function initWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.warn("VAPID keys are missing from environment variables.");
    return false;
  }

  webpush.setVapidDetails(
    "mailto:support@hubconnect.co.za",
    publicKey,
    privateKey
  );

  return true;
}

export async function sendOrderNotification({
  userId,
  title,
  message,
  link = "/orders",
}: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  const supabase = await createClient();

  // 1. Check if user enabled order updates
  const { data: profile } = await supabase
    .from("profiles")
    .select("push_notifications_enabled, order_updates_enabled")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.order_updates_enabled) return;

  // 2. Always record in-app notification table
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    link,
  });

  // 3. Send Web Push if push is enabled
  if (profile?.push_notifications_enabled) {
    const isReady = initWebPush();
    if (!isReady) return;

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (subscriptions && subscriptions.length > 0) {
      const payload = JSON.stringify({ title, body: message, url: link });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired or invalid; clean up stale database row
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          } else {
            console.error("Web Push delivery error:", err);
          }
        }
      }
    }
  }
}