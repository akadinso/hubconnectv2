"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Role = "buyer" | "seller" | "admin";

const ROLE_INFO: Record<
  Role,
  { label: string; description: string; className: string }
> = {
  buyer: {
    label: "Buyer",
    description: "You can browse and buy items.",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  seller: {
    label: "Seller",
    description: "You can list items and manage orders.",
    className:
      "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  },
  admin: {
    label: "Admin",
    description: "You can manage users and the whole platform.",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  },
};

type Notifications = {
  push: boolean;
  orders: boolean;
};

const NOTIFICATION_OPTIONS: {
  key: keyof Notifications;
  label: string;
  description: string;
}[] = [
  {
    key: "push",
    label: "Push notifications",
    description: "Get alerts on your device.",
  },
  {
    key: "orders",
    label: "Order updates",
    description: "Know when an order is placed, confirmed or completed.",
  },
];

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function UserDialog({
  fullName,
  username,
  avatarUrl,
  role,
  applicationPending,
}: {
  fullName: string | null;
  username?: string | null;
  avatarUrl: string | null;
  role: Role | null;
  applicationPending?: boolean;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [notifications, setNotifications] = useState<Notifications>({
    push: true,
    orders: true,
  });

  const displayName = fullName || "Add your name";

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            className="rounded-full p-0"
            aria-label="Open profile"
          >
            <Avatar className="size-9">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback>{initialsOf(displayName)}</AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Profile</AlertDialogTitle>
          <AlertDialogDescription>
            Your account details and notifications.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-5">
          <section className="flex items-center gap-4">
            <Avatar className="size-16 shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="text-lg">
                {initialsOf(displayName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="min-w-0">
                <p className="truncate text-base font-medium">{displayName}</p>
                {username && (
                  <p className="truncate text-xs text-muted-foreground">
                    @{username}
                  </p>
                )}
              </div>

              {role && (
                <>
                  <span
                    className={cn(
                      "w-fit rounded-full px-2.5 py-0.5 text-xs font-medium",
                      ROLE_INFO[role].className,
                    )}
                  >
                    {ROLE_INFO[role].label}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_INFO[role].description}
                  </p>
                </>
              )}
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">Notifications</h3>
            {NOTIFICATION_OPTIONS.map(({ key, label, description }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor={`notif-${key}`}>{label}</Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  id={`notif-${key}`}
                  checked={notifications[key]}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, [key]: checked }))
                  }
                />
              </div>
            ))}
          </section>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/account" onClick={() => setOpen(false)}>
            <Button size="sm" type="button">
              My account
            </Button>
          </Link>
          {username && (
            <Link href={`/profile/${username}`} onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" type="button">
                View profile
              </Button>
            </Link>
          )}
          {role === "buyer" && (
            <Link href="/seller/onboarding" onClick={() => setOpen(false)}>
              <Button
                size="sm"
                type="button"
                variant={applicationPending ? "secondary" : "default"}
              >
                {applicationPending ? "Application pending" : "Become a seller"}
              </Button>
            </Link>
          )}
          <Link href="/settings/profile" onClick={() => setOpen(false)}>
            <Button variant="outline" size="sm" type="button">
              Edit profile
            </Button>
          </Link>
        </div>

        <Separator />

        <AlertDialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut />
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>

          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
