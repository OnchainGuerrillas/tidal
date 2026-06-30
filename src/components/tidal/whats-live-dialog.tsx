"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
      <div
        className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${toneClasses} self-start`}
      >
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

export function WhatsLiveDialog({ compact = false }: { compact?: boolean }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className={
              compact
                ? "h-8 gap-1.5 border-emerald-500/30 bg-emerald-500/5 text-[0.6875rem] text-emerald-300 hover:bg-emerald-500/10"
                : "h-8 gap-1.5 border-emerald-500/30 bg-emerald-500/5 text-[0.6875rem] text-emerald-300 hover:bg-emerald-500/10"
            }
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
  );
}
