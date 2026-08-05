import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  size?: "sm" | "md";
}

const tamanos = {
  sm: { box: "h-10 w-10 rounded-xl", icon: 18 },
  md: { box: "h-12 w-12 rounded-2xl", icon: 22 },
};

export function IconBadge({ icon: Icon, size = "md" }: Props) {
  const { box, icon } = tamanos[size];
  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center border border-border bg-background text-accent shadow-glow-sm`}
    >
      <Icon size={icon} strokeWidth={2} />
    </div>
  );
}
