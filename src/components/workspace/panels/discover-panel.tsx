"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { SectionLabel } from "@/components/tidal/section-label";
import { DiscoveryCard } from "@/components/workspace/discover/discovery-card";
import { RecommendationCard } from "@/components/workspace/discover/recommendation-card";
import { PanelShell } from "@/components/workspace/panels/panel-shell";
import { getDiscoverForWorkspace } from "@/mock-data/workspace/discover";

type DiscoverPanelProps = {
  workspaceId: string;
  onClose: () => void;
};

type DiscoverView = "recommendations" | "discover";

export function DiscoverPanel({ workspaceId, onClose }: DiscoverPanelProps) {
  const discover = getDiscoverForWorkspace(workspaceId);
  const [view, setView] = useState<DiscoverView>("recommendations");

  return (
    <PanelShell
      eyebrow="Discover"
      title="Opportunities"
      description="Suggestions and research candidates for this workspace."
      onClose={onClose}
    >
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setView("recommendations")}
          className={cn(
            "tidal-tab-button",
            view === "recommendations" && "tidal-tab-button--active"
          )}
        >
          Recommendations
        </button>
        <button
          type="button"
          onClick={() => setView("discover")}
          className={cn(
            "tidal-tab-button",
            view === "discover" && "tidal-tab-button--active"
          )}
        >
          Discover
        </button>
      </div>

      {view === "recommendations" ? (
        <div className="space-y-3">
          <SectionLabel>Tailored recommendations</SectionLabel>
          {discover.recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <SectionLabel>Worth researching</SectionLabel>
          {discover.discoveryItems.map((item) => (
            <DiscoveryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </PanelShell>
  );
}
