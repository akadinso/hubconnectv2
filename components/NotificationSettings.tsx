"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NotificationSettings({ userId }: { userId: string }) {
  const supabase = createClient();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [orderUpdatesEnabled, setOrderUpdatesEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPreferences() {
      const { data } = await supabase
        .from("profiles")
        .select("push_notifications_enabled, order_updates_enabled")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setPushEnabled(data.push_notifications_enabled ?? false);
        setOrderUpdatesEnabled(data.order_updates_enabled ?? true);
      }
      setLoading(false);
    }

    loadPreferences();
  }, [userId, supabase]);

  const handlePushToggle = async (checked: boolean) => {
    setPushEnabled(checked);

    if (checked) {
      // 1. Request browser notification permission
      if ("Notification" in window && "serviceWorker" in navigator) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const reg = await navigator.serviceWorker.register("/sw.js");
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          });

          // Save subscription to Supabase
          const subJson = sub.toJSON();
          if (subJson.endpoint && subJson.keys) {
            await supabase.from("push_subscriptions").upsert({
              user_id: userId,
              endpoint: subJson.endpoint,
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            });
          }
        } else {
          setPushEnabled(false);
          alert("Notification permission was denied in your browser settings.");
          return;
        }
      }
    } else {
      // Unsubscribe if toggled off
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", userId)
            .eq("endpoint", sub.endpoint);
        }
      }
    }

    // 2. Persist preference to profiles table
    await supabase
      .from("profiles")
      .update({ push_notifications_enabled: checked })
      .eq("id", userId);
  };

  const handleOrderUpdatesToggle = async (checked: boolean) => {
    setOrderUpdatesEnabled(checked);
    await supabase
      .from("profiles")
      .update({ order_updates_enabled: checked })
      .eq("id", userId);
  };

  if (loading) return null;

  return (
    <Card className="w-full max-w-md border border-slate-100 shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-slate-900">
          Notifications
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Push Notifications Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-bold text-slate-900">
              Push notifications
            </Label>
            <p className="text-xs text-slate-500">Get alerts on your device.</p>
          </div>
          <Switch checked={pushEnabled} onCheckedChange={handlePushToggle} />
        </div>

        {/* Order Updates Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-bold text-slate-900">
              Order updates
            </Label>
            <p className="text-xs text-slate-500">
              Know when an order is placed, confirmed or completed.
            </p>
          </div>
          <Switch
            checked={orderUpdatesEnabled}
            onCheckedChange={handleOrderUpdatesToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
}
