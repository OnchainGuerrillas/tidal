"use client";

import { useState, useSyncExternalStore } from "react";
import { ChatCircle, Graph, Lightning, X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "tidal-onboarding-dismissed-v1";

function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return Boolean(window.localStorage.getItem(STORAGE_KEY));
}

/**
 * Returns true once we know the overlay is dismissed. Server snapshot is
 * `true` so SSR renders nothing; client snapshot reads localStorage. Avoids
 * the hydration mismatch and the setState-in-effect lint warning.
 */
function useOnboardingDismissed(): boolean {
  return useSyncExternalStore(
    subscribeToStorage,
    readDismissed,
    () => true,
  );
}

type Step = {
  icon: React.ComponentType<{ weight?: "bold"; className?: string }>;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    icon: ChatCircle,
    title: "Tell the agent what you want",
    body: 'Open the chat panel on the left and type a plain-English goal — "stake 0.05 SOL on Jito" or "swap 0.05 SOL to USDC and lend it on Kamino."',
  },
  {
    icon: Graph,
    title: "See it as a graph",
    body: "The agent drops the strategy onto the canvas as connected nodes. You can edit amounts, change protocols, or add nodes from the Nodes panel before running.",
  },
  {
    icon: Lightning,
    title: "Run on mainnet",
    body: "Hit Run to sign and execute every transaction. Real funds, real positions. The Investments panel updates with your live state when it finishes.",
  },
];

export function WorkspaceWelcomeOverlay() {
  const dismissed = useOnboardingDismissed();
  const [forceClosed, setForceClosed] = useState(false);

  if (dismissed || forceClosed) return null;

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
    setForceClosed(true);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Dismiss welcome overlay"
        onClick={dismiss}
        className="pointer-events-auto absolute inset-0 cursor-default bg-black/30 backdrop-blur-[2px]"
      />
      <div className="pointer-events-auto relative flex w-full max-w-md flex-col gap-4 rounded-xl border border-tidal-border bg-tidal-card p-5 shadow-2xl shadow-black/40">
        <button
          type="button"
          aria-label="Close welcome"
          onClick={dismiss}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-tidal-muted transition-colors hover:bg-tidal-sidebar-active hover:text-tidal-accent"
        >
          <X weight="bold" className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-1 pr-8">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-tidal-accent">
            Welcome to Tidal
          </span>
          <h2 className="text-base font-semibold text-foreground">
            Build DeFi strategies as graphs the agent composes for you.
          </h2>
        </div>

        <ol className="flex flex-col gap-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex gap-3 rounded-lg border border-tidal-border bg-background/30 p-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tidal-accent/15 text-[11px] font-bold text-tidal-accent">
                  {idx + 1}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Icon weight="bold" className="h-3.5 w-3.5 text-tidal-accent" />
                    {step.title}
                  </div>
                  <p className="text-[12px] leading-snug text-tidal-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-tidal-muted">
            This message won&rsquo;t come back. Look for &ldquo;What&rsquo;s
            live&rdquo; in the header for capability status.
          </span>
          <Button size="sm" onClick={dismiss}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
