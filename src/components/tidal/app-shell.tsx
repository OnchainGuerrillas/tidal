"use client";

import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/tidal/app-header";
import { AppSidebar } from "@/components/tidal/app-sidebar";
import { DesignModeBanner } from "@/components/tidal/design-mode-banner";
import { useTidalAuth } from "@/hooks/use-tidal-auth";
import { isDesignMode } from "@/lib/app-mode";
import { useWorkspace } from "@/providers/workspace-provider";

function isWorkspaceRoute(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return false;
  }

  return pathname.split("/").filter(Boolean).length >= 1;
}

/**
 * App shell + auth gate.
 *
 * In live mode the app is login-gated: logged-out visitors see a sign-in
 * screen, and authed users see only their own DB-backed workspaces (no
 * shared mock workspaces). Design mode has no Privy/DB, so it skips the gate
 * and renders the shell around its in-memory scratch workspace.
 *
 * On workspace routes the header/sidebar are rendered as in-canvas overlays
 * (see workspace-screen), so the shell here only wraps the main area.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, authenticated, login } = useTidalAuth();
  const { workspaces } = useWorkspace();

  if (!isDesignMode) {
    if (!ready) return <ShellFallback label="Starting Tidal…" />;
    if (!authenticated) return <LoginGate onLogin={login} />;
    // Authed but the user's DB workspaces haven't materialized yet (initial
    // load, or first-login auto-create in flight). Hold the shell so we never
    // flash the non-persisted placeholder workspace.
    if (workspaces.length === 0) {
      return <ShellFallback label="Loading your workspaces…" />;
    }
  }

  const workspaceRoute = isWorkspaceRoute(pathname);

  if (workspaceRoute) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DesignModeBanner />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DesignModeBanner />
      <AppHeader />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function LoginGate({ onLogin }: { onLogin: () => void | Promise<void> }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-2xl border border-tidal-border bg-tidal-card p-8 text-center shadow-lg shadow-black/30">
        <div className="mb-2 text-2xl font-semibold tracking-tight text-tidal-accent">
          Tidal
        </div>
        <p className="mb-6 text-sm leading-relaxed text-tidal-muted">
          Sign in to compose Solana DeFi strategies on your own canvas and run
          them on mainnet.
        </p>
        <button
          type="button"
          onClick={() => onLogin()}
          className="w-full rounded-md bg-tidal-accent px-4 py-2 text-sm font-medium text-tidal-card transition-opacity hover:opacity-90"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

function ShellFallback({ label }: { label: string }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-sm text-tidal-muted">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-tidal-border border-t-tidal-accent" />
        {label}
      </div>
    </div>
  );
}
