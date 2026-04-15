import Image from "next/image";

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Image
        src="/logo.png"
        alt="VaraSocial"
        width={32}
        height={32}
        className="h-8 w-8 object-contain brightness-0 invert"
      />
      {!collapsed && (
        <span className="text-xl font-bold text-foreground">VaraSocial</span>
      )}
    </div>
  );
}
