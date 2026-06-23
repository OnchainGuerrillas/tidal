import { isDesignMode } from "@/lib/app-mode";

export function DesignModeBanner() {
  if (!isDesignMode) {
    return null;
  }

  return (
    <div className="flex h-8 shrink-0 items-center justify-center bg-tidal-accent px-4 text-center text-[12px] font-semibold text-background">
      Tidal is in design mode
    </div>
  );
}
