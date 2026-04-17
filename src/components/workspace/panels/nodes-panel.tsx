"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/tidal/badge";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { PanelShell } from "@/components/workspace/panels/panel-shell";
import {
  nodeCatalog,
  isCatalogItemCompatible,
} from "@/mock-data/workspace/catalog";
import {
  nodePickerGroups,
  type NodePickerGroup,
} from "@/mock-data/workspace/types";

const groupLabels: Record<NodePickerGroup, string> = {
  strategy: "Strategy",
  route_math: "Routing & math",
  rewards: "Rewards",
  wallet: "Wallet",
};

type NodesPanelProps = {
  onSelect: (catalogItemId: string) => void;
  onClose: () => void;
};

export function NodesPanel({ onSelect, onClose }: NodesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<NodePickerGroup | "all">(
    "all"
  );

  const items = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return nodeCatalog.filter((item) => {
      if (selectedGroup !== "all" && item.group !== selectedGroup) {
        return false;
      }

      if (query.length === 0) {
        return true;
      }

      if (item.title.toLowerCase().includes(query)) return true;
      if (item.description.toLowerCase().includes(query)) return true;
      if (item.protocolLabel?.toLowerCase().includes(query)) return true;
      if (item.keywords?.some((keyword) => keyword.toLowerCase().includes(query))) {
        return true;
      }
      return false;
    });
  }, [searchQuery, selectedGroup]);

  return (
    <PanelShell
      eyebrow="Nodes"
      title="Add to canvas"
      description="Browse or search available nodes. Clicking a card drops it on the canvas."
      onClose={onClose}
    >
      <div className="mb-4 space-y-3">
        <label className="flex items-center gap-2 rounded-lg border border-tidal-border bg-background/30 px-3 py-2">
          <MagnifyingGlass
            className="h-3.5 w-3.5 text-tidal-muted"
            weight="bold"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search nodes"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-tidal-muted"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedGroup("all")}
            className={cn(
              "tidal-meta-pill cursor-pointer transition-colors",
              selectedGroup === "all"
                ? "border-tidal-accent bg-tidal-sidebar-active text-tidal-accent"
                : "bg-tidal-card hover:border-tidal-accent/30 hover:text-tidal-accent"
            )}
          >
            All
          </button>
          {nodePickerGroups.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedGroup(group)}
              className={cn(
                "tidal-meta-pill cursor-pointer transition-colors",
                selectedGroup === group
                  ? "border-tidal-accent bg-tidal-sidebar-active text-tidal-accent"
                  : "bg-tidal-card hover:border-tidal-accent/30 hover:text-tidal-accent"
              )}
            >
              {groupLabels[group]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <SurfaceCard tone="muted">
            <p className="tidal-text-message">No nodes match the current filter.</p>
          </SurfaceCard>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              disabled={!isCatalogItemCompatible(item)}
              className="tidal-node-catalog-item"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <div className="min-w-0 text-left">
                  {item.protocolLabel ? (
                    <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.04em] text-tidal-muted">
                      {item.protocolLabel}
                    </div>
                  ) : null}
                  <div className="text-sm font-medium text-foreground">
                    {item.title}
                  </div>
                </div>
                {item.primaryOutputAsset ? (
                  <Badge variant="token" size="xs" className="shrink-0">
                    {item.primaryOutputAsset}
                  </Badge>
                ) : null}
              </div>
              <div className="mt-1 text-left text-[11px] leading-tight text-tidal-muted">
                {item.description}
              </div>
            </button>
          ))
        )}
      </div>
    </PanelShell>
  );
}
