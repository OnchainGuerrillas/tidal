"use client";

import { SurfaceCard } from "@/components/tidal/surface-card";
import { InvestmentCard } from "@/components/workspace/investments/investment-card";
import { InvestmentPerformanceChart } from "@/components/workspace/investments/investment-performance-chart";
import { PanelShell } from "@/components/workspace/panels/panel-shell";
import { getInvestmentsForWorkspace } from "@/mock-data/workspace/investments";

type InvestmentsPanelProps = {
  workspaceId: string;
  onClose: () => void;
};

export function InvestmentsPanel({ workspaceId, onClose }: InvestmentsPanelProps) {
  const investments = getInvestmentsForWorkspace(workspaceId);

  return (
    <PanelShell
      eyebrow="Investments"
      title="Your active positions"
      description="Positions currently running inside this workspace."
      onClose={onClose}
    >
      <div className="space-y-5">
        <InvestmentPerformanceChart performance={investments.performance} />

        {investments.positions.length === 0 ? (
          <SurfaceCard tone="muted">
            <p className="tidal-text-message">
              No active positions yet. Build a strategy on the canvas or accept a
              recommendation from Discover to see it listed here.
            </p>
          </SurfaceCard>
        ) : (
          <div className="space-y-3">
            {investments.positions.map((position) => (
              <InvestmentCard key={position.id} position={position} />
            ))}
          </div>
        )}
      </div>
    </PanelShell>
  );
}
