"use client";

import { memo, useEffect, useRef, useState } from "react";
import {
  Handle,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";
import { Timer, X } from "@phosphor-icons/react";

import { Badge } from "@/components/tidal/badge";
import { CompactSelect } from "@/components/tidal/compact-select";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { useWorkspaceBuilderContext } from "@/components/workspace/workspace-builder-context";
import { useAdapterRate, formatApy } from "@/hooks/workspace/use-adapter-rate";
import { formatWorkspaceNodeStatusLabel } from "@/lib/workspace/status";
import { getAdapterCatalogEntry } from "@/lib/solana/adapter-catalog";
import { useNodeRunStatus } from "@/providers/run-status-provider";
import { runStatusRingClass } from "@/lib/workspace/run-status-styles";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  formatPercent,
  formatUsd,
  leverageFactor,
  projectCompoundedValue,
} from "@/lib/workspace/yield-math";
import {
  collectIntervals,
  type StrategyNodeType,
} from "@/mock-data/workspace/types";
import type { WidgetSchema } from "@/lib/solana/types";

export const StrategyNode = memo(
  ({ id, data, isConnectable }: NodeProps<StrategyNodeType>) => {
    const builderContext = useWorkspaceBuilderContext();
    const isEditable = builderContext?.isEditable ?? false;
    const showCollector = data.apyType === "earn";
    const primaryOutput = data.outputs.find((output) => output.kind === "primary");
    const adapterEntry = data.catalogItemId
      ? getAdapterCatalogEntry(data.catalogItemId)
      : undefined;
    const widgetValues = data.widgetValues ?? {};
    const reactFlow = useReactFlow();
    const runStatus = useNodeRunStatus(id);
    const rateState = useAdapterRate(data.catalogItemId);
    const { workspace } = useWorkspace();
    // When this node has any incoming edge from another node on the
    // canvas, the runner overrides this node's `amount` widget with
    // the upstream output. Showing the widget would be misleading —
    // it'd display whatever the user originally typed even though
    // the actual amount that flows is dictated upstream. Hide the
    // amount widget specifically (other widgets like slippage,
    // borrow amount, and asset selectors stay visible).
    const hasUpstream = workspace.edges.some((e) => e.target === id);
    const liveApy =
      rateState.kind === "ready" && rateState.rate
        ? formatApy(rateState.rate.apy)
        : null;
    const apyDisplay = liveApy ?? data.apy;
    const apyIsLoading = rateState.kind === "loading";
    // Generic swap-style adapters express their "what does this do" via
    // input/output asset widgets. When both are picked, render the
    // dynamic action ("Swap USDC → SOL") in place of the static label.
    const inputAssetSelected =
      typeof widgetValues.inputAsset === "string"
        ? widgetValues.inputAsset
        : null;
    const outputAssetSelected =
      typeof widgetValues.outputAsset === "string"
        ? widgetValues.outputAsset
        : null;
    const dynamicActionLabel =
      inputAssetSelected && outputAssetSelected
        ? `${data.action} ${inputAssetSelected} → ${outputAssetSelected}`
        : data.action;

    // Forward-looking yield projection — answers the "what would I
    // actually earn?" question on the node face without requiring the
    // user to run anything. Two flavors:
    //   1. Standard earn-side adapters (Jito stake, Kamino supply) with
    //      a live APY and an amount widget → 1-year compounded projection
    //      in the input asset's units (e.g., "≈ 0.0006 SOL/yr").
    //   2. Leverage-loop node specifically → effective collateral
    //      exposure derived from loopCount × targetLTV widgets ("1.5×
    //      exposure"). True net-of-borrow yield needs the Kamino USDC
    //      borrow rate which we don't surface yet — defer until that
    //      lands.
    const projection = computeProjection({
      catalogItemId: data.catalogItemId,
      apy:
        rateState.kind === "ready" && rateState.rate
          ? rateState.rate.apy
          : null,
      amount:
        typeof widgetValues.amount === "number" ? widgetValues.amount : null,
      loopCount:
        typeof widgetValues.loopCount === "number"
          ? widgetValues.loopCount
          : null,
      targetLTV:
        typeof widgetValues.targetLTV === "number"
          ? widgetValues.targetLTV
          : null,
      inputAsset: data.inputAsset,
      apyType: data.apyType,
    });

    return (
      <SurfaceCard
        className={`w-[280px] bg-[#15202E] transition-shadow ${runStatusRingClass(runStatus)}`}
        padding="none"
      >
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="h-3! w-3! rounded-full! border-2! border-tidal-accent! bg-tidal-card!"
        />

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="tidal-text-eyebrow">{data.protocol}</span>
            <div className="flex items-center gap-2">
              <Badge variant="status">{formatWorkspaceNodeStatusLabel(data.status)}</Badge>
              {isEditable ? (
                <button
                  type="button"
                  aria-label="Remove node"
                  title="Remove node"
                  onClick={(event) => {
                    event.stopPropagation();
                    reactFlow.deleteElements({ nodes: [{ id }] });
                  }}
                  className="nodrag flex h-5 w-5 items-center justify-center rounded-md text-tidal-muted transition-colors hover:bg-tidal-sidebar-active hover:text-red-400"
                >
                  <X weight="bold" className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mb-3 tidal-text-body">{dynamicActionLabel}</div>

          <p className="mb-3 tidal-text-caption text-tidal-muted">{data.summary}</p>

          <div className="mb-3 flex items-center gap-2 tidal-text-caption">
            <Badge variant="token" size="xs">
              {data.inputAsset}
            </Badge>
            <svg
              className="shrink-0 text-tidal-muted"
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
            >
              <path
                d="M1 4h10M8 1l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Badge variant="token" size="xs">
              {primaryOutput?.asset ?? "Output"}
            </Badge>
          </div>

          <div className="mb-1 flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold ${
                data.apyType === "earn" ? "text-emerald-400" : "text-amber-400"
              } ${apyIsLoading ? "opacity-60" : ""}`}
            >
              {apyDisplay}
            </span>
            <span className="tidal-text-caption">
              {data.apyType === "earn" ? "APY" : "Borrow Cost"}
            </span>
            {liveApy ? (
              <span className="tidal-text-caption text-tidal-accent">
                · live
              </span>
            ) : null}
          </div>
          {projection ? (
            <div className="mb-3 tidal-text-caption text-tidal-muted">
              {projection}
            </div>
          ) : null}

          {data.holdingsLabel ? (
            <div className="mb-2 tidal-text-caption text-foreground">
              {data.holdingsLabel}
            </div>
          ) : null}

          {adapterEntry && isEditable ? (
            <div className="mb-3 space-y-2 rounded-lg border border-tidal-border/70 bg-background/30 p-2">
              <div className="tidal-text-caption text-tidal-muted">
                Inputs
              </div>
              {hasUpstream ? (
                <div className="rounded-md border border-tidal-accent/30 bg-tidal-accent/5 px-2 py-1.5 text-[11px] text-tidal-accent">
                  Amount: from upstream node
                </div>
              ) : null}
              {adapterEntry.widgets
                .filter((widget) => !(widget.key === "amount" && hasUpstream))
                .map((widget) => (
                <WidgetInput
                  key={widget.key}
                  widget={widget}
                  value={widgetValues[widget.key]}
                  onChange={(nextValue) =>
                    builderContext?.updateNodeData(id, (currentData) => {
                      if (currentData.nodeKind !== "strategy") {
                        return currentData;
                      }
                      // For swap-style asset selectors, the widget value
                      // also drives typed metadata that React Flow uses
                      // for edge-compatibility checks. Mirror inputAsset
                      // -> data.inputAsset/acceptedAssets and outputAsset
                      // -> data.outputs[0].asset so dragging an edge from
                      // a swap node into a downstream node respects the
                      // new direction.
                      let nextInputAsset = currentData.inputAsset;
                      let nextAcceptedAssets = currentData.acceptedAssets;
                      let nextOutputs = currentData.outputs;
                      if (
                        widget.key === "inputAsset" &&
                        typeof nextValue === "string" &&
                        nextValue.length > 0
                      ) {
                        nextInputAsset = nextValue;
                        nextAcceptedAssets = [nextValue];
                      }
                      if (
                        widget.key === "outputAsset" &&
                        typeof nextValue === "string" &&
                        nextValue.length > 0
                      ) {
                        nextOutputs = currentData.outputs.map((output) =>
                          output.kind === "primary"
                            ? { ...output, asset: nextValue }
                            : output,
                        );
                      }
                      return {
                        ...currentData,
                        inputAsset: nextInputAsset,
                        acceptedAssets: nextAcceptedAssets,
                        outputs: nextOutputs,
                        widgetValues: {
                          ...(currentData.widgetValues ?? {}),
                          [widget.key]: nextValue,
                        },
                        draftState: {
                          hasChanges: true,
                          changedFields: Array.from(
                            new Set([
                              ...(currentData.draftState?.changedFields ?? []),
                              `widget:${widget.key}`,
                            ]),
                          ),
                        },
                      };
                    })
                  }
                />
              ))}
            </div>
          ) : null}

          {data.platformLink ? (
            <a
              href={data.platformLink.href}
              target="_blank"
              rel="noreferrer"
              className="tidal-text-caption text-tidal-accent transition-colors hover:text-tidal-accent/80"
            >
              {data.platformLink.label}
            </a>
          ) : null}

          {data.outputs.length > 0 ? (
            <div className="mt-4 space-y-2 border-t border-tidal-border pt-3">
              {isEditable ? (
                <div className="tidal-text-caption text-tidal-muted">
                  Drag from an output circle to continue the flow.
                </div>
              ) : null}
              {data.outputs.map((output) => (
                <div
                  key={output.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-tidal-border/60 bg-background/30 px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <div className="tidal-text-caption text-foreground">
                      {output.label}
                    </div>
                    <div className="tidal-text-caption text-tidal-muted">
                      {output.asset}
                    </div>
                  </div>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={output.id}
                    isConnectable={isConnectable}
                    aria-label={`${output.label} output`}
                    className="!static h-4! w-4! shrink-0 cursor-crosshair rounded-full! border-2! border-tidal-accent! bg-tidal-card! transition-transform hover:scale-110"
                  />
                </div>
              ))}
            </div>
          ) : null}

          {isEditable && data.actionOptions && data.actionOptions.length > 1 ? (
            <div className="mt-3 space-y-2 border-t border-tidal-border/70 pt-3">
              <div className="tidal-text-caption text-tidal-muted">
                Strategy setup
              </div>
              <CompactSelect
                options={data.actionOptions}
                value={data.action}
                onChange={(nextAction) =>
                  builderContext?.updateNodeData(id, (currentData) => {
                    if (currentData.nodeKind !== "strategy") {
                      return currentData;
                    }

                    return {
                      ...currentData,
                      action: nextAction,
                      draftState: {
                        hasChanges: true,
                        changedFields: Array.from(
                          new Set([
                            ...(currentData.draftState?.changedFields ?? []),
                            "action",
                          ])
                        ),
                      },
                    };
                  })
                }
              />
            </div>
          ) : null}
        </div>

        {showCollector && (
          <div className="border-t border-tidal-border px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Timer weight="bold" className="h-3 w-3 text-tidal-muted" />
              <span className="tidal-text-caption font-semibold">
                Fee Collector
              </span>
            </div>
            {isEditable ? (
              <CompactSelect
                options={collectIntervals}
                value={data.collectInterval ?? "Weekly"}
                onChange={(nextInterval) =>
                  builderContext?.updateNodeData(id, (currentData) => {
                    if (currentData.nodeKind !== "strategy") {
                      return currentData;
                    }

                    return {
                      ...currentData,
                      collectInterval: nextInterval,
                      outputs: currentData.outputs.map((output) =>
                        output.kind === "reward"
                          ? { ...output, cadenceLabel: nextInterval }
                          : output
                      ),
                      draftState: {
                        hasChanges: true,
                        changedFields: Array.from(
                          new Set([
                            ...(currentData.draftState?.changedFields ?? []),
                            "collectInterval",
                          ])
                        ),
                      },
                    };
                  })
                }
              />
            ) : (
              <div className="tidal-text-caption text-foreground">
                {data.collectInterval ?? "Weekly"}
              </div>
            )}
          </div>
        )}
      </SurfaceCard>
    );
  }
);

StrategyNode.displayName = "StrategyNode";

type ProjectionInput = {
  catalogItemId: string | undefined;
  apy: number | null;
  amount: number | null;
  loopCount: number | null;
  targetLTV: number | null;
  inputAsset: string;
  apyType: "earn" | "cost";
};

/**
 * Build the human-readable yield projection string shown below the
 * APY display on adapter-backed strategy nodes. Returns null when
 * there's nothing useful to project (no live APY, no amount entered,
 * etc.). Display lives inline so changes to the amount widget
 * propagate the moment the user types.
 */
function computeProjection(input: ProjectionInput): string | null {
  // Leverage-loop node gets a dedicated treatment: show effective
  // collateral exposure derived from loop count + target LTV. We
  // can't compute a true net-of-borrow yield without the Kamino
  // USDC borrow rate, which we don't surface yet — keeping this honest.
  if (input.catalogItemId === "kamino-leverage-loop") {
    if (input.loopCount === null || input.targetLTV === null) return null;
    const factor = leverageFactor(input.loopCount, input.targetLTV);
    const ltvPct = (input.targetLTV * 100).toFixed(0);
    return `${factor.toFixed(2)}× collateral exposure (${input.loopCount} loop${input.loopCount === 1 ? "" : "s"} × ${ltvPct}% LTV)`;
  }

  // For earn-side adapters with a live APY and an amount widget,
  // project the position 1 year forward and show the projected
  // accrued yield. Borrow-side adapters skip this (the cost story
  // belongs in the position tracker).
  if (input.apyType !== "earn") return null;
  if (input.apy === null || input.amount === null) return null;

  const projected = projectCompoundedValue(input.amount, input.apy, 1);
  const accrued = projected - input.amount;

  // For USDC-denominated positions, present in $. For SOL/JitoSOL/
  // mSOL, present in the asset's units (no live USD price feed yet).
  if (input.inputAsset === "USDC" || input.inputAsset === "USDT") {
    return `≈ ${formatUsd(accrued)}/yr (${formatPercent(input.apy)} compounded)`;
  }
  return `≈ ${accrued.toFixed(4)} ${input.inputAsset}/yr (${formatPercent(input.apy)} compounded)`;
}

type WidgetInputProps = {
  widget: WidgetSchema;
  value: unknown;
  onChange: (next: number | string | undefined) => void;
};

function WidgetInput({ widget, value, onChange }: WidgetInputProps) {
  // The `nodrag` className tells React Flow to ignore pointer events on
  // this element so typing/clicking inside the input doesn't drag the
  // node around the canvas.
  const requiredMarker = widget.required ? (
    <span className="text-tidal-accent"> *</span>
  ) : null;

  if (widget.kind === "asset-selector" && widget.options) {
    const stringValue = typeof value === "string" ? value : "";
    return (
      <label className="flex flex-col gap-1 nodrag">
        <span className="tidal-text-caption text-tidal-muted">
          {widget.label}
          {requiredMarker}
        </span>
        <select
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-md border border-tidal-border bg-tidal-card px-2 py-1 text-sm text-foreground outline-none focus:border-tidal-accent"
        >
          {stringValue === "" ? <option value="">Select…</option> : null}
          {widget.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  // Default: number input. We keep a local string while the user is
  // typing so intermediate states like "0.", "0.0", or ".5" render
  // verbatim instead of getting parsed to a number, re-stringified by
  // the parent, and snapping the cursor mid-edit. The `lastSentRef`
  // lets us distinguish "parent value changed because of our keystroke"
  // (do nothing) from "parent value changed externally" (sync down).
  return <NumberWidgetInput widget={widget} value={value} onChange={onChange} requiredMarker={requiredMarker} />;
}

function NumberWidgetInput({
  widget,
  value,
  onChange,
  requiredMarker,
}: WidgetInputProps & { requiredMarker: React.ReactNode }) {
  const [localString, setLocalString] = useState<string>(() =>
    typeof value === "number" ? String(value) : "",
  );
  const lastSentRef = useRef<number | undefined>(
    typeof value === "number" ? value : undefined,
  );

  // Sync down only when the parent value changed for reasons other
  // than our own onChange (e.g., another part of the app reset the
  // node). The lastSentRef lets us distinguish self-induced changes
  // from external ones, so typing "0.0" doesn't get clobbered by the
  // parent's re-stringification of 0.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (value !== lastSentRef.current) {
      setLocalString(typeof value === "number" ? String(value) : "");
      lastSentRef.current = typeof value === "number" ? value : undefined;
    }
  }, [value]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <label className="flex flex-col gap-1 nodrag">
      <span className="tidal-text-caption text-tidal-muted">
        {widget.label}
        {requiredMarker}
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={widget.min}
        max={widget.max}
        step="any"
        value={localString}
        onChange={(event) => {
          const raw = event.target.value;
          setLocalString(raw);
          if (raw === "") {
            lastSentRef.current = undefined;
            onChange(undefined);
            return;
          }
          const parsed = Number(raw);
          if (Number.isFinite(parsed)) {
            lastSentRef.current = parsed;
            onChange(parsed);
          }
        }}
        className="rounded-md border border-tidal-border bg-tidal-card px-2 py-1 text-sm text-foreground outline-none focus:border-tidal-accent"
      />
    </label>
  );
}
