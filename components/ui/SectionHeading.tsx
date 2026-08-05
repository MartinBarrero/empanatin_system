import type { LucideIcon } from "lucide-react";
import { IconBadge } from "./IconBadge";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function SectionHeading({ icon, title, description }: Props) {
  return (
    <div className="mb-10 flex items-center gap-4">
      <IconBadge icon={icon} />
      <div>
        <h2 className="font-serif text-3xl font-bold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
    </div>
  );
}
