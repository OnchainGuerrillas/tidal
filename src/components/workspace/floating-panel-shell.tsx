import type { ReactNode } from "react";

import { MaterialIcon } from "@/components/tidal/material-icon";
import { cn } from "@/lib/utils";

type FloatingPanelShellProps = {
  side: "left" | "right";
  accent?: boolean;
  tone?: "accent" | "canvas";
  icon: string;
  title?: string;
  description?: string;
  iconOnlyHeader?: boolean;
  showExpandButton?: boolean;
  onClose: () => void;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FloatingPanelShell({
  side,
  accent = false,
  tone,
  icon,
  title,
  description,
  iconOnlyHeader = false,
  showExpandButton = false,
  onClose,
  headerActions,
  children,
  className,
}: FloatingPanelShellProps) {
  const resolvedTone = tone ?? (accent ? "accent" : "canvas");

  return (
    <div
      className={cn(
        "tidal-floating-panel pointer-events-auto",
        side === "left" ? "tidal-floating-panel--left" : "tidal-floating-panel--right",
        resolvedTone === "accent"
          ? "tidal-floating-panel--accent"
          : "tidal-floating-panel--canvas",
        className
      )}
    >
      <div
        className={cn(
          "tidal-floating-panel-header",
          iconOnlyHeader && "tidal-floating-panel-header--icon-only"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <MaterialIcon
            name={icon}
            className={cn(
              iconOnlyHeader ? "text-xl text-tidal-accent" : "mt-0.5 text-xl text-tidal-accent"
            )}
          />
          {!iconOnlyHeader && title ? (
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-medium text-tidal-accent">{title}</h2>
              {description ? (
                <p className="mt-1 text-[13px] leading-snug text-tidal-placeholder">
                  {description}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {headerActions}
          {showExpandButton ? (
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              className="flex h-8 w-8 items-center justify-center rounded-md text-tidal-muted transition-colors hover:bg-tidal-sidebar-active hover:text-tidal-accent"
            >
              <MaterialIcon name="aspect_ratio" className="text-lg" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Collapse panel"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-tidal-muted transition-colors hover:bg-tidal-sidebar-active hover:text-tidal-accent"
          >
            <MaterialIcon name="keyboard_arrow_down" className="text-lg" />
          </button>
        </div>
      </div>
      <div className="tidal-floating-panel-body">{children}</div>
    </div>
  );
}
