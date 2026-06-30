import { cn } from "@/lib/utils";

type MaterialIconProps = {
  name: string;
  className?: string;
  filled?: boolean;
};

export function MaterialIcon({ name, className, filled }: MaterialIconProps) {
  return (
    <span
      className={cn(
        filled ? "material-symbols-rounded" : "material-symbols-outlined",
        className
      )}
      aria-hidden
    >
      {name}
    </span>
  );
}
