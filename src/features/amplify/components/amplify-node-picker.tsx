"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";

import { Badge } from "@/components/tidal/badge";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { cn } from "@/lib/utils";
import type {
  AmplifyNodeCatalogItem,
  AmplifyNodePickerGroup,
} from "@/mock-data/amplify/types";

export type AmplifyNodePickerItemState = {
  item: AmplifyNodeCatalogItem;
  disabled: boolean;
  disabledReason: string | null;
};

export type AmplifyNodePickerGroupState = {
  group: AmplifyNodePickerGroup;
  label: string;
  count: number;
  disabled: boolean;
  emptyMessage: string;
};

type AmplifyNodePickerProps = {
  title: string;
  description: string;
  groups: AmplifyNodePickerGroupState[];
  selectedGroup: AmplifyNodePickerGroup;
  searchQuery: string;
  items: AmplifyNodePickerItemState[];
  onSearchQueryChange: (value: string) => void;
  onSelectedGroupChange: (group: AmplifyNodePickerGroup) => void;
  onSelectItem: (item: AmplifyNodeCatalogItem) => void;
};

export function AmplifyNodePicker({
  title,
  description,
  groups,
  selectedGroup,
  searchQuery,
  items,
  onSearchQueryChange,
  onSelectedGroupChange,
  onSelectItem,
}: AmplifyNodePickerProps) {
  const activeGroup = groups.find((group) => group.group === selectedGroup);

  return (
    <SurfaceCard className="border border-tidal-border bg-tidal-card/95 shadow-lg shadow-black/30">
      <div className="mb-4 space-y-3">
        <div>
          <div className="tidal-text-eyebrow">{title}</div>
          <p className="mt-1 tidal-text-caption text-tidal-muted">{description}</p>
        </div>

        <label className="flex items-center gap-2 rounded-lg border border-tidal-border bg-background/30 px-3 py-2">
          <MagnifyingGlass className="h-3.5 w-3.5 text-tidal-muted" weight="bold" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search nodes"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-tidal-muted"
          />
        </label>
      </div>

      <div className="flex min-h-[22rem] gap-3">
        <div className="flex w-[128px] shrink-0 flex-col gap-1.5 border-r border-tidal-border/70 pr-3">
          {groups.map((group) => {
            const isActive = group.group === selectedGroup;

            return (
              <button
                key={group.group}
                type="button"
                disabled={group.disabled}
                onClick={() => onSelectedGroupChange(group.group)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors",
                  isActive
                    ? "border-tidal-accent bg-tidal-sidebar-active text-tidal-accent"
                    : "border-tidal-border bg-background/20 text-foreground hover:border-tidal-accent/30 hover:bg-background/40",
                  group.disabled &&
                    "cursor-not-allowed border-tidal-border/50 bg-background/10 text-tidal-muted hover:border-tidal-border/50 hover:bg-background/10"
                )}
              >
                <span className="text-xs font-medium">{group.label}</span>
                <span className="text-[10px] text-current/70">{group.count}</span>
              </button>
            );
          })}
        </div>

        <div className="min-w-0 flex-1">
          {items.length > 0 ? (
            <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
              {items.map(({ item, disabled, disabledReason }) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectItem(item)}
                  className={cn(
                    "flex w-full cursor-pointer flex-col items-start rounded-lg border px-3 py-3 text-left transition-colors",
                    disabled
                      ? "cursor-not-allowed border-tidal-border/50 bg-background/20 text-tidal-muted"
                      : "border-tidal-border bg-background/40 text-foreground hover:border-tidal-accent/40 hover:bg-tidal-sidebar-active"
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <div className="min-w-0">
                      {item.protocolLabel ? (
                        <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.04em] text-tidal-muted">
                          {item.protocolLabel}
                        </div>
                      ) : null}
                      <div className="text-sm font-medium">{item.title}</div>
                    </div>
                    {item.primaryOutputAsset ? (
                      <Badge variant="token" size="xs" className="shrink-0">
                        {item.primaryOutputAsset}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-1 text-[11px] leading-tight opacity-80">
                    {item.description}
                  </div>
                  {disabledReason ? (
                    <div className="mt-2 text-[11px] leading-tight text-amber-400">
                      {disabledReason}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[22rem] items-center justify-center rounded-lg border border-dashed border-tidal-border/70 bg-background/10 px-6 text-center">
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">
                  {activeGroup?.label ?? "Category"} is empty
                </div>
                <p className="tidal-text-caption text-tidal-muted">
                  {activeGroup?.emptyMessage ??
                    "No nodes are available in this section for the current picker state."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </SurfaceCard>
  );
}
