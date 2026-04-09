import { cn } from "@/lib/utils";
import { SectionLabel } from "@/components/tidal/section-label";
import type {
  InvestmentInterestLabel,
  PreferenceOption,
  RiskAppetiteLabel,
} from "@/mock-data/shell/types";

type PreferenceContextPanelProps = {
  title?: string;
  description?: string;
  riskOptions: PreferenceOption<RiskAppetiteLabel>[];
  interestOptions: PreferenceOption<InvestmentInterestLabel>[];
  onRiskToggle: (label: RiskAppetiteLabel) => void;
  onInterestToggle: (label: InvestmentInterestLabel) => void;
  className?: string;
  showRiskOptions?: boolean;
  showInterestOptions?: boolean;
};

function PreferenceOptionPill({
  checked,
  label,
}: {
  checked: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex cursor-pointer items-center gap-3 rounded-full border px-4 py-2 transition-colors",
        checked
          ? "border-tidal-accent bg-tidal-card text-tidal-accent hover:bg-tidal-sidebar-active/70"
          : "border-tidal-border bg-tidal-card text-tidal-muted hover:border-tidal-accent/30 hover:bg-tidal-sidebar-active/60 hover:text-tidal-accent"
      )}
    >
      <span
        className={cn(
          "h-4 w-4 rounded-full border",
          checked
            ? "border-tidal-accent bg-tidal-accent"
            : "border-tidal-muted/70 bg-transparent"
        )}
      />
      <span className="tidal-text-label font-medium">{label}</span>
    </div>
  );
}

export function PreferenceContextPanel({
  title = "Chat context",
  description = "These preferences shape how Tidal frames suggestions across global chat and workspace threads.",
  riskOptions,
  interestOptions,
  onRiskToggle,
  onInterestToggle,
  className,
  showRiskOptions = true,
  showInterestOptions = true,
}: PreferenceContextPanelProps) {
  return (
    <section className={cn("tidal-context-panel space-y-5", className)}>
      <div className="space-y-2">
        <SectionLabel>{title}</SectionLabel>
        <p className="max-w-4xl tidal-text-body">{description}</p>
      </div>

      {showRiskOptions ? (
        <div className="space-y-3">
          <SectionLabel className="block">Risk appetite</SectionLabel>
          <div className="flex flex-wrap gap-3">
            {riskOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => onRiskToggle(option.label)}
                className="text-left"
                aria-pressed={option.checked}
              >
                <PreferenceOptionPill
                  checked={option.checked}
                  label={option.label}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showInterestOptions ? (
        <div className="space-y-3">
          <SectionLabel className="block">Investment interests</SectionLabel>
          <div className="flex flex-wrap gap-3">
            {interestOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => onInterestToggle(option.label)}
                className="text-left"
                aria-pressed={option.checked}
              >
                <PreferenceOptionPill
                  checked={option.checked}
                  label={option.label}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
