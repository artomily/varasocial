import { User as UserIcon } from "lucide-react";

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`${sizeMap[size]} flex shrink-0 items-center justify-center rounded-full bg-white/10 font-semibold text-foreground`}>
      {initials || <UserIcon className="h-4 w-4" />}
    </div>
  );
}
