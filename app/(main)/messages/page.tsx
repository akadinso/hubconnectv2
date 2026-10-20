import { MessageCircle } from "lucide-react";

export default function MessagesIndexPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
      <MessageCircle className="size-8" />
      <p className="text-sm">Select a conversation to start messaging</p>
    </div>
  );
}
