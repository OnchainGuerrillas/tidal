"use client";

import Image from "next/image";
import Link from "next/link";

import { WhatsLiveDialog } from "@/components/tidal/whats-live-dialog";

export function AppHeader() {
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
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <WhatsLiveDialog />
        </div>
      </div>
    </header>
  );
}
