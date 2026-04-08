import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const chatMessageVariants = cva("", {
  variants: {
    role: {
      ai: "tidal-text-message",
      user: "tidal-text-message rounded-[10px] border border-tidal-border bg-tidal-card p-2 font-medium",
    },
  },
  defaultVariants: {
    role: "ai",
  },
});

type ChatMessageProps = {
  className?: string;
  children: React.ReactNode;
} & VariantProps<typeof chatMessageVariants>;

export function ChatMessage({
  children,
  className,
  role,
}: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className={cn(chatMessageVariants({ role }), className)}>
          {children}
        </div>
      </div>
    );
  }

  return <p className={cn(chatMessageVariants({ role }), className)}>{children}</p>;
}
