"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UsersIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  StoreIcon,
} from "lucide-react";

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  role: string;
  verified: boolean;
  onboarded: boolean;
  bio: string;
  createdAt: string;
};

interface SectionCardsProps {
  users?: AdminUser[];
  totalListings?: number;
}

export function SectionCards({
  users = [],
  totalListings = 0,
}: SectionCardsProps) {
  const totalUsers = users.length;
  const verifiedUsers = users.filter((u) => u.verified).length;
  const onboardedUsers = users.filter((u) => u.onboarded).length;

  const verifiedRate =
    totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;
  const onboardedRate =
    totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              <UsersIcon className="size-3 text-muted-foreground" />
              Total
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Registered accounts
          </div>
          <div className="text-muted-foreground">
            All registered HubConnect users
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Verified Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {verifiedUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 text-green-600 dark:text-green-400"
            >
              <ShieldCheckIcon className="size-3" />
              {verifiedRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Identity verified
          </div>
          <div className="text-muted-foreground">
            {verifiedRate}% of total user base
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Onboarded Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {onboardedUsers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 text-blue-600 dark:text-blue-400"
            >
              <UserCheckIcon className="size-3" />
              {onboardedRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Completed setup
          </div>
          <div className="text-muted-foreground">Active and ready accounts</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Listings</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalListings.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              <StoreIcon className="size-3 text-muted-foreground" />
              Inventory
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Marketplace products
          </div>
          <div className="text-muted-foreground">
            Active seller inventory items
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
