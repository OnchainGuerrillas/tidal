"use client";

import Image from "next/image";
import Link from "next/link";

import { SidebarTrigger } from "@/components/ui/sidebar";
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
import { usePreferenceProfile } from "@/features/shell/providers/preference-profile-provider";

export function AppHeader() {
  const { profile, toggleInterestOption, toggleRiskOption } = usePreferenceProfile();
  const activeRiskOption =
    profile.riskOptions.find((option) => option.checked)?.label ?? "Risk appetite";
  const selectedInterestCount = profile.interestOptions.filter(
    (option) => option.checked
  ).length;

  return (
    <header className="border-b border-tidal-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between gap-4 px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="flex h-7 items-center"
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
          <SidebarTrigger className="text-tidal-muted hover:text-tidal-accent" />
        </div>

        <div className="flex items-center gap-3">
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
                  This is your global Tidal risk setting. It shapes how chat,
                  Pool, and Amplify suggestions are framed across the prototype.
                </DialogDescription>
              </DialogHeader>

              <PreferenceContextPanel
                title="Global risk appetite"
                description="Update your standing risk appetite here. This applies across all chat and workspace surfaces."
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
                  These are your global Tidal investment interests. They shape how
                  chat, Pool, and Amplify opportunities are framed across the prototype.
                </DialogDescription>
              </DialogHeader>

              <PreferenceContextPanel
                title="Global investment interests"
                description="Update the investment categories you want Tidal to prioritise across all chat and workspace surfaces."
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
