"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Timer } from "@phosphor-icons/react";

import { Badge } from "@/components/tidal/badge";
import { CompactSelect } from "@/components/tidal/compact-select";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { useAmplifyBuilderContext } from "@/features/amplify/components/amplify-builder-context";
import { formatAmplifyStatusLabel } from "@/features/amplify/lib/status";
import {
  collectIntervals,
  type StrategyNodeType,
} from "@/mock-data/amplify/types";

export const StrategyNode = memo(
  ({ id, data, isConnectable }: NodeProps<StrategyNodeType>) => {
    const builderContext = useAmplifyBuilderContext();
    const isEditable = builderContext?.isEditable ?? false;
    const showCollector = data.apyType === "earn";
    const primaryOutput = data.outputs.find((output) => output.kind === "primary");

    return (
      <SurfaceCard className="w-[280px] bg-[#15202E]" padding="none">
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="h-3! w-3! rounded-full! border-2! border-tidal-accent! bg-tidal-card!"
        />

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="tidal-text-eyebrow">{data.protocol}</span>
            <Badge variant="status">{formatAmplifyStatusLabel(data.status)}</Badge>
          </div>

          <div className="mb-3 tidal-text-body">{data.action}</div>

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

          <div className="mb-3 flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold ${
                data.apyType === "earn" ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {data.apy}
            </span>
            <span className="tidal-text-caption">
              {data.apyType === "earn" ? "APY" : "Borrow Cost"}
            </span>
          </div>

          {data.holdingsLabel ? (
            <div className="mb-2 tidal-text-caption text-foreground">
              {data.holdingsLabel}
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
