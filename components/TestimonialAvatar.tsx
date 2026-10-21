import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function TestimonialAvatar({
  src,
  name,
}: {
  src?: string | null;
  name: string;
}) {
  return (
    <Avatar className="size-12 bg-white ring-2 ring-white/40">
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className="bg-white p-1.5">
        <Image
          src="/eduvos-logo.png"
          alt="Eduvos"
          width={40}
          height={40}
          className="size-full object-contain"
        />
      </AvatarFallback>
    </Avatar>
  );
}
