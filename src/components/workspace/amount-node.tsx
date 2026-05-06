"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import { Badge } from "@/components/tidal/badge";
import { CompactSelect } from "@/components/tidal/compact-select";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { useWorkspaceBuilderContext } from "@/components/workspace/workspace-builder-context";
import { formatWorkspaceNodeStatusLabel } from "@/lib/workspace/status";
import { runStatusRingClass } from "@/lib/workspace/run-status-styles";
import { useNodeRunStatus } from "@/providers/run-status-provider";
import type { AmountNodeType } from "@/mock-data/workspace/types";

const amountModes = ["percent", "fixed"] as const;

export const AmountNode = memo(
  ({ id, data, isConnectable }: NodeProps<AmountNodeType>) => {
    const builderContext = useWorkspaceBuilderContext();
    const isEditable = builderContext?.isEditable ?? false;
    const runStatus = useNodeRunStatus(id);

    // Default to 50 in percent mode if value isn't set yet — this is
    // the canonical "split in half" semantics. Persisted onto data.value
    // the first time the user touches the input.
    const currentValue =
      typeof data.value === "number" ? data.value : data.amountMode === "percent" ? 50 : 0;

    return (
      <SurfaceCard
        className={`w-[280px] bg-[#15202E] transition-shadow ${runStatusRingClass(runStatus)}`}
      >
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="h-3! w-3! rounded-full! border-2! border-tidal-accent! bg-tidal-card!"
        />

        <div className="mb-3 flex items-center justify-between">
          <span className="tidal-text-eyebrow">{data.title}</span>
          <Badge variant="status">{formatWorkspaceNodeStatusLabel(data.status)}</Badge>
        </div>

        <p className="mb-3 tidal-text-caption text-tidal-muted">{data.summary}</p>

        <div className="mb-3 flex items-center gap-2 tidal-text-caption">
          <Badge variant="token" size="xs">
            {data.sourceAsset}
          </Badge>
          <span className="text-foreground">
            {data.amountMode === "percent"
              ? `${currentValue}% of input`
              : `${currentValue} ${data.sourceAsset}`}
          </span>
        </div>

        {isEditable ? (
          <div className="mb-3 space-y-2 border-t border-tidal-border/70 pt-3">
            <div className="tidal-text-caption text-tidal-muted">
              Amount setup
            </div>
            <div className="flex gap-2">
              <CompactSelect
                className="w-[92px]"
                options={amountModes}
                value={data.amountMode}
                onChange={(nextMode) =>
                  builderContext?.updateNodeData(id, (currentData) => {
                    if (currentData.nodeKind !== "amount") {
                      return currentData;
                    }
                    return {
                      ...currentData,
                      amountMode: nextMode,
                      // Reset value to a sensible default when toggling
                      // mode — 50% is the canonical percent default,
                      // 0 forces user to type a fixed amount.
                      value: nextMode === "percent" ? 50 : 0,
                      draftState: {
                        hasChanges: true,
                        changedFields: Array.from(
                          new Set([
                            ...(currentData.draftState?.changedFields ?? []),
                            "amountMode",
                          ]),
                        ),
                      },
                    };
                  })
                }
              />
              <ValueInput
                value={currentValue}
                mode={data.amountMode}
                onChange={(nextValue) =>
                  builderContext?.updateNodeData(id, (currentData) => {
                    if (currentData.nodeKind !== "amount") {
                      return currentData;
                    }
                    return {
                      ...currentData,
                      value: nextValue,
                      // Mirror onto amountLabel for the display text.
                      amountLabel:
                        currentData.amountMode === "percent"
                          ? `${nextValue}% ${currentData.sourceAsset}`
                          : `${nextValue} ${currentData.sourceAsset}`,
                      draftState: {
                        hasChanges: true,
                        changedFields: Array.from(
                          new Set([
                            ...(currentData.draftState?.changedFields ?? []),
                            "amount",
                          ]),
                        ),
                      },
                    };
                  })
                }
              />
            </div>
            {data.amountMode === "fixed" ? (
              <div className="tidal-text-caption text-amber-300">
                Fixed mode isn&apos;t runnable yet — runner doesn&apos;t track
                per-edge asset decimals. Use percent mode to execute.
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="tidal-text-caption text-foreground">{data.maxAmountLabel}</div>

        <Handle
          type="source"
          position={Position.Right}
          id="next"
          isConnectable={isConnectable}
          className="h-3! w-3! rounded-full! border-2! border-tidal-accent! bg-tidal-card!"
        />
      </SurfaceCard>
    );
  },
);

AmountNode.displayName = "AmountNode";

/**
 * Local-string number input mirroring the NumberWidgetInput pattern in
 * strategy-node.tsx — keeps "0.0" / "0." intermediate states from
 * being clobbered by the parent re-stringifying the parsed number.
 */
function ValueInput({
  value,
  mode,
  onChange,
}: {
  value: number;
  mode: "fixed" | "percent";
  onChange: (next: number) => void;
}) {
  const [localString, setLocalString] = useState<string>(() => String(value));
  const lastSentRef = useRef<number>(value);

  // Sync down only when the parent value changed for reasons other
  // than our own onChange (e.g., mode toggle reset). Same latest-ref
  // pattern as NumberWidgetInput.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (value !== lastSentRef.current) {
      setLocalString(String(value));
      lastSentRef.current = value;
    }
  }, [value]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const max = mode === "percent" ? 100 : undefined;

  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      max={max}
      step="any"
      value={localString}
      onChange={(event) => {
        const raw = event.target.value;
        setLocalString(raw);
        if (raw === "") {
          lastSentRef.current = 0;
          onChange(0);
          return;
        }
        const parsed = Number(raw);
        if (Number.isFinite(parsed) && parsed >= 0) {
          lastSentRef.current = parsed;
          onChange(parsed);
        }
      }}
      className="nodrag w-full rounded-md border border-tidal-border bg-background/40 px-2.5 py-2 text-xs text-foreground outline-none transition-colors focus:border-tidal-accent/40"
    />
  );
}
