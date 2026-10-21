"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { initialsOf } from "@/lib/format";
import { updateBasicProfile } from "@/app/(main)/account/actions";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export function ProfileEditDialog({
  userId,
  initial,
  trigger,
}: {
  userId: string;
  initial: { fullName: string; bio: string; avatarUrl: string | null };
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [open, setOpen] = React.useState(false);
  const [fullName, setFullName] = React.useState(initial.fullName);
  const [bio, setBio] = React.useState(initial.bio);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function reset() {
    setFullName(initial.fullName);
    setBio(initial.bio);
    setFile(null);
    setPreview(null);
    setRemoveAvatar(false);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;

    if (!picked.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (picked.size > MAX_AVATAR_SIZE) {
      setError("Image must be smaller than 2MB.");
      return;
    }
    setError(null);
    setFile(picked);
    setRemoveAvatar(false);
    setPreview(URL.createObjectURL(picked));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    let avatar: "keep" | "remove" | "uploaded" = removeAvatar
      ? "remove"
      : "keep";

    if (file) {
      const { error: uploadError } = await createClient()
        .storage.from("avatars")
        .upload(`${userId}/avatar`, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        setError(uploadError.message);
        setPending(false);
        return;
      }
      avatar = "uploaded";
    }

    const result = await updateBasicProfile({ fullName, bio, avatar });
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    toast.success("Profile updated");
    setOpen(false);
    router.refresh();
  }

  const shown = removeAvatar ? null : (preview ?? initial.avatarUrl);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="size-24">
              {shown && <AvatarImage src={shown} alt="Your photo" />}
              <AvatarFallback className="text-2xl">
                {initialsOf(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-3 text-xs">
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => fileRef.current?.click()}
                disabled={pending}
              >
                Change photo
              </button>
              {shown && (
                <button
                  type="button"
                  className="text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => {
                    setRemoveAvatar(true);
                    setFile(null);
                    setPreview(null);
                  }}
                  disabled={pending}
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFile}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={60}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-bio">Short Bio</Label>
            <Textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Tell people what you sell or what you're building"
            />
            <p className="text-right text-xs text-muted-foreground">
              {bio.length}/300
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
