import { SectionLabel } from "@/components/tidal/section-label";

type PromotionSummaryPanelProps = {
  title?: string;
  summary: string;
};

export function PromotionSummaryPanel({
  title = "Promoted from global chat",
  summary,
}: PromotionSummaryPanelProps) {
  return (
    <div className="tidal-context-panel">
      <div className="mb-2">
        <SectionLabel>{title}</SectionLabel>
        <p className="mt-2 tidal-text-body">Summary seed</p>
      </div>
      <p className="tidal-text-message">{summary}</p>
    </div>
  );
}
