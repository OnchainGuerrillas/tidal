"use client";

import { InvestmentsContent } from "@/components/workspace/investments-view";
import { PanelShell } from "@/components/workspace/panels/panel-shell";

type InvestmentsPanelProps = {
  workspaceId: string;
  onClose: () => void;
};

export function InvestmentsPanel({ workspaceId, onClose }: InvestmentsPanelProps) {
  void workspaceId;

  return (
    <PanelShell
      eyebrow="Investments"
      title="Your active positions"
      description="Live positions across registered protocol adapters for the connected wallet."
      onClose={onClose}
    >
      <InvestmentsContent />
    </PanelShell>
  );
}
