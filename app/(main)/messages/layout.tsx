import { Suspense } from "react";
import { MessagesShell } from "@/components/MessagesShell";
import {
  ConversationListData,
  ListSkeleton,
} from "@/components/ConversationListData";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesShell
      sidebar={
        <Suspense fallback={<ListSkeleton />}>
          <ConversationListData />
        </Suspense>
      }
    >
      {children}
    </MessagesShell>
  );
}
