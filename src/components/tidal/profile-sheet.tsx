"use client";

import {
  Check,
  Copy,
  PencilSimple,
  SignOut,
  Wallet,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMe, type MeProfile } from "@/hooks/use-me";
import { useTidalAuth } from "@/hooks/use-tidal-auth";
import { cn } from "@/lib/utils";

type ProfileSheetProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
};

const STATUS_STYLES: Record<MeProfile["recentRuns"][number]["status"], string> = {
  success: "text-emerald-400",
  partial: "text-amber-400",
  failed: "text-red-400",
};

function getInitials(profile: MeProfile): string {
  const source =
    profile.user.displayName?.trim() ||
    profile.user.email ||
    profile.user.primaryWalletAddress ||
    "?";
  const parts = source.split(/[\s@]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function shortAddress(addr: string | null): string {
  if (!addr) return "—";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const { logout } = useTidalAuth();
  const { state, updateDisplayName } = useMe();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setSaveError(null);
    }
  }, [open]);

  useEffect(() => {
    if (state.status === "ready") {
      setDraftName(state.profile.user.displayName ?? "");
    }
  }, [state]);

  const wallet =
    state.status === "ready" ? state.profile.user.primaryWalletAddress : null;

  const handleCopy = async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const next = draftName.trim();
      await updateDisplayName(next.length === 0 ? null : next);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const headerInitials = useMemo(() => {
    if (state.status === "ready") return getInitials(state.profile);
    return "··";
  }, [state]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border/60 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
              {headerInitials}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <SheetTitle className="truncate">
                {state.status === "ready"
                  ? state.profile.user.displayName ?? "Tidal user"
                  : "Profile"}
              </SheetTitle>
              <SheetDescription className="truncate">
                {state.status === "ready"
                  ? state.profile.user.email ?? shortAddress(wallet)
                  : "Loading…"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {state.status === "loading" && (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          )}
          {state.status === "unauthenticated" && (
            <p className="text-sm text-muted-foreground">
              Sign in from the chat panel to see your profile.
            </p>
          )}
          {state.status === "error" && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state.status === "ready" && (
            <ReadyProfileBody
              profile={state.profile}
              editing={editing}
              draftName={draftName}
              setDraftName={setDraftName}
              onEdit={() => setEditing(true)}
              onCancelEdit={() => {
                setEditing(false);
                setDraftName(state.profile.user.displayName ?? "");
                setSaveError(null);
              }}
              onSave={handleSave}
              saving={saving}
              saveError={saveError}
              wallet={wallet}
              copied={copied}
              onCopy={handleCopy}
            />
          )}
        </div>

        <div className="border-t border-border/60 p-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={state.status !== "ready"}
            onClick={() => {
              void logout();
              onOpenChange(false);
            }}
          >
            <SignOut weight="bold" />
            Log out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

type ReadyProfileBodyProps = {
  profile: MeProfile;
  editing: boolean;
  draftName: string;
  setDraftName: (next: string) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  saving: boolean;
  saveError: string | null;
  wallet: string | null;
  copied: boolean;
  onCopy: () => void;
};

function ReadyProfileBody({
  profile,
  editing,
  draftName,
  setDraftName,
  onEdit,
  onCancelEdit,
  onSave,
  saving,
  saveError,
  wallet,
  copied,
  onCopy,
}: ReadyProfileBodyProps) {
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <SectionLabel>Display name</SectionLabel>
        {editing ? (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={60}
              placeholder="Add a display name"
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={onSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>
              {saveError && (
                <span className="text-xs text-destructive">{saveError}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">
              {profile.user.displayName ?? (
                <span className="text-muted-foreground">No name set</span>
              )}
            </span>
            <Button size="icon-sm" variant="ghost" onClick={onEdit}>
              <PencilSimple />
              <span className="sr-only">Edit display name</span>
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>Primary wallet</SectionLabel>
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
          <Wallet weight="bold" className="text-tidal-muted" />
          <span className="flex-1 font-mono text-xs text-foreground">
            {wallet ?? "Not linked"}
          </span>
          {wallet && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onCopy}
              aria-label="Copy wallet address"
            >
              {copied ? <Check weight="bold" /> : <Copy />}
            </Button>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>Linked accounts</SectionLabel>
        {profile.linkedAccounts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No linked accounts.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {profile.linkedAccounts.map((account, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-2.5 py-1.5 text-xs"
              >
                {account.kind === "wallet" && (
                  <>
                    <span className="font-mono">{shortAddress(account.address)}</span>
                    <span className="text-muted-foreground">
                      {account.walletClientType ?? "wallet"}
                      {account.chainType ? ` · ${account.chainType}` : ""}
                    </span>
                  </>
                )}
                {account.kind === "email" && (
                  <>
                    <span className="truncate">{account.email}</span>
                    <span className="text-muted-foreground">email</span>
                  </>
                )}
                {account.kind === "oauth" && (
                  <>
                    <span className="truncate">{account.email ?? "—"}</span>
                    <span className="text-muted-foreground">{account.provider}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="Workspaces" value={profile.workspaces.length} />
        <Stat label="Runs" value={profile.recentRuns.length} subtle="last 5" />
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>Recent runs</SectionLabel>
        {profile.recentRuns.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No runs yet. Compose a strategy and hit Run.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {profile.recentRuns.map((run) => (
              <li
                key={run.id}
                className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-2.5 py-1.5 text-xs"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-foreground">
                    {run.workspaceName}
                  </span>
                  <span className="text-muted-foreground">
                    {formatTimestamp(run.completedAt ?? run.startedAt)}
                  </span>
                </div>
                <span className={cn("text-xs font-semibold", STATUS_STYLES[run.status])}>
                  {run.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-tidal-muted">
      {children}
    </p>
  );
}

function Stat({
  label,
  value,
  subtle,
}: {
  label: string;
  value: number;
  subtle?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-tidal-muted">
        {label}
      </span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
      {subtle && <span className="text-[10px] text-muted-foreground">{subtle}</span>}
    </div>
  );
}
