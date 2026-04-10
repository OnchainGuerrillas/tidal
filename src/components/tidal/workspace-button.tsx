import { cn } from "@/lib/utils";

type WorkspaceButtonProps = {
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function WorkspaceButton({
  className,
  children,
  type = "button",
  ...props
}: WorkspaceButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "tidal-pill-button",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
