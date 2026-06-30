"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/tidal/badge";
import { MaterialIcon } from "@/components/tidal/material-icon";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { FloatingPanelShell } from "@/components/workspace/floating-panel-shell";
import { PanelShell } from "@/components/workspace/panels/panel-shell";
import { TemplatesGrid } from "@/components/workspace/panels/templates-grid";
import {
  nodeCatalog,
  isCatalogItemCompatible,
} from "@/mock-data/workspace/catalog";

type NodesFilter = "all" | "templates" | "strategy";

type NodesPanelProps = {
  onSelect: (catalogItemId: string) => void;
  onClose: () => void;
  variant?: "default" | "floating";
};

const NODES_DESCRIPTION =
  "Browse or search available nodes, or search through defined strategy templates. Click a node or strategy to place it on the canvas";

export function NodesPanel({
  onSelect,
  onClose,
  variant = "default",
}: NodesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<NodesFilter>("all");

  const items = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return nodeCatalog.filter((item) => {
      if (selectedFilter === "strategy" && item.group !== "strategy") {
        return false;
      }

      if (selectedFilter === "templates") {
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
  }, [searchQuery, selectedFilter]);

  const filtersToolbar = (
    <div className="flex flex-wrap gap-2">
      {(
        [
          ["all", "All"],
          ["templates", "Templates"],
          ["strategy", "Strategy"],
        ] as const
      ).map(([filter, label]) => (
        <button
          key={filter}
          type="button"
          onClick={() => setSelectedFilter(filter)}
          className={cn(
            "tidal-nodes-filter-chip",
            selectedFilter === filter && "tidal-nodes-filter-chip--active"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const catalogList = (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {selectedFilter === "templates" ? (
        <TemplatesGrid />
      ) : (
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
      )}
    </div>
  );

  if (variant === "floating") {
    return (
      <FloatingPanelShell
        side="left"
        tone="canvas"
        icon="flowchart"
        iconOnlyHeader
        showExpandButton
        onClose={onClose}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="tidal-nodes-panel-intro">
            <h2 className="tidal-nodes-panel-title">Nodes</h2>
            <p className="tidal-nodes-panel-description">{NODES_DESCRIPTION}</p>
          </div>

          <div className="mb-3 shrink-0 space-y-3">
            <label className="tidal-nodes-search">
              <MaterialIcon name="search" className="text-[15px] text-tidal-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search nodes"
                className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-tidal-placeholder"
              />
            </label>
            {filtersToolbar}
          </div>

          {catalogList}
        </div>
      </FloatingPanelShell>
    );
  }

  const body = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 shrink-0 space-y-3">
        <label className="tidal-floating-panel-search">
          <MaterialIcon name="search" className="text-[15px] text-tidal-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search nodes"
            className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-tidal-placeholder"
          />
        </label>
        {filtersToolbar}
      </div>
      {catalogList}
    </div>
  );

  return (
    <PanelShell
      eyebrow="Nodes"
      title="Add to canvas"
      description="Browse or search available nodes. Clicking a card drops it on the canvas."
      onClose={onClose}
    >
      {body}
    </PanelShell>
  );
}
