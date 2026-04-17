import type { ReactNode } from "react";
import { X } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { SectionLabel } from "@/components/tidal/section-label";

type PanelShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  onClose: () => void;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function PanelShell({
  eyebrow,
  title,
  description,
  onClose,
  actions,
  className,
  children,
}: PanelShellProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex items-start justify-between gap-3 px-4 pt-5">
        <div className="min-w-0 flex-1 space-y-1">
          {eyebrow ? <SectionLabel>{eyebrow}</SectionLabel> : null}
          <h2 className="tidal-text-thread-title">{title}</h2>
          {description ? (
            <p className="tidal-text-message">{description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-tidal-muted transition-colors hover:bg-tidal-sidebar-active hover:text-tidal-accent"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-4 pb-5">
        {children}
      </div>
    </div>
  );
}
