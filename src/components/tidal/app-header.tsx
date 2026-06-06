"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PreferenceContextPanel } from "@/components/tidal/preference-context-panel";
import { WorkspaceTabs } from "@/components/tidal/workspace-tabs";
import { usePreferenceProfile } from "@/providers/preference-profile-provider";

export function AppHeader() {
  const { profile, toggleInterestOption, toggleRiskOption } =
    usePreferenceProfile();
  const activeRiskOption =
    profile.riskOptions.find((option) => option.checked)?.label ??
    "Risk appetite";
  const selectedInterestCount = profile.interestOptions.filter(
    (option) => option.checked
  ).length;

  return (
    <header className="border-b border-tidal-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between gap-4 px-3 md:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <Link
            href="/"
            className="flex h-7 shrink-0 items-center"
            aria-label="Tidal home"
          >
            <Image
              src="/SVG/tidal-single-logo.svg"
              alt="Tidal"
              width={92}
              height={28}
              className="h-6 w-auto"
              priority
            />
          </Link>
          <WorkspaceTabs />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  className="h-8 gap-1.5 border-emerald-500/30 bg-emerald-500/5 text-[0.6875rem] text-emerald-300 hover:bg-emerald-500/10"
                  size="sm"
                />
              }
            >
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              What&rsquo;s live
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="pr-10">
                <DialogTitle>Tidal alpha — what&rsquo;s testable today</DialogTitle>
                <DialogDescription>
                  We&rsquo;re in an alpha state. The list below is honest about what
                  you can exercise end-to-end right now versus what&rsquo;s coming.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 p-1">
                <CapabilitySection
                  title="Live on mainnet"
                  tone="live"
                  items={[
                    "Liquid staking — Jito (SOL → JitoSOL) and BlazeStake (SOL → bSOL), stake + unstake",
                    "Lending — Kamino USDC supply, withdraw, borrow, repay+withdraw",
                    "Swaps — Jupiter Ultra (any pair across SOL / USDC / USDT / JitoSOL / mSOL / bSOL)",
                    "Leverage — Kamino + Jupiter recursive supply-and-borrow loop (composite node)",
                    "Investments panel — live Kamino obligations + Jito balances, auto-refresh after runs",
                    "AI chat — compose strategy from plain language for the four canonical intents",
                  ]}
                />
                <CapabilitySection
                  title="Coming soon"
                  tone="soon"
                  items={[
                    "Template forking — currently placeholder cards in the Templates panel",
                    "Intelligent multi-node composition — agent today picks from 4 intents; real synthesis is in progress",
                    "Autonomous execution with batch preview + single approval",
                    "Multichain — Base / EVM scaffolding",
                    "Portfolio management surface — deployment / rebalance / unwind aggregations",
                    "Onboarding walkthrough and tutorials",
                  ]}
                />
                <p className="rounded-md border border-tidal-border bg-background/30 px-3 py-2 text-[11px] text-tidal-muted">
                  Found a bug or have a question?{" "}
                  <span className="text-foreground">Just hit the chat panel</span> —
                  it&rsquo;s the fastest way to get our attention right now.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  className="h-8 border-tidal-border bg-tidal-card/70 text-[0.6875rem] text-tidal-accent hover:bg-tidal-sidebar-active"
                  size="sm"
                />
              }
            >
              {`Risk: ${activeRiskOption}`}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="pr-10">
                <DialogTitle>Risk appetite</DialogTitle>
                <DialogDescription>
                  This is your global Tidal risk setting. It shapes how
                  suggestions are framed across your workspaces.
                </DialogDescription>
              </DialogHeader>

              <PreferenceContextPanel
                title="Global risk appetite"
                description="Update your standing risk appetite here. It applies across every workspace."
                riskOptions={profile.riskOptions}
                interestOptions={profile.interestOptions}
                onRiskToggle={toggleRiskOption}
                onInterestToggle={toggleInterestOption}
                showInterestOptions={false}
              />
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  className="h-8 border-tidal-border bg-tidal-card/70 text-[0.6875rem] text-tidal-accent hover:bg-tidal-sidebar-active"
                  size="sm"
                />
              }
            >
              {selectedInterestCount > 0
                ? `Investment types (${selectedInterestCount})`
                : "Investment types"}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="pr-10">
                <DialogTitle>Investment types</DialogTitle>
                <DialogDescription>
                  These are your global Tidal investment interests. They shape
                  how opportunities are framed across every workspace.
                </DialogDescription>
              </DialogHeader>

              <PreferenceContextPanel
                title="Global investment interests"
                description="Update the investment categories you want Tidal to prioritise across every workspace."
                riskOptions={profile.riskOptions}
                interestOptions={profile.interestOptions}
                onRiskToggle={toggleRiskOption}
                onInterestToggle={toggleInterestOption}
                showRiskOptions={false}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}

type CapabilitySectionProps = {
  title: string;
  tone: "live" | "soon";
  items: string[];
};

function CapabilitySection({ title, tone, items }: CapabilitySectionProps) {
  const toneClasses =
    tone === "live"
      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
      : "border-tidal-border bg-tidal-card/40 text-tidal-muted";
  return (
    <section className="flex flex-col gap-2">
      <div className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${toneClasses} self-start`}>
        {title}
      </div>
      <ul className="flex flex-col gap-1 pl-1 text-[12px] leading-snug text-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span
              className={
                tone === "live"
                  ? "mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-emerald-400"
                  : "mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-tidal-muted"
              }
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
