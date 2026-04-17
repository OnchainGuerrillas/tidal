"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import { Badge } from "@/components/tidal/badge";
import { CompactSelect } from "@/components/tidal/compact-select";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { useWorkspaceBuilderContext } from "@/components/workspace/workspace-builder-context";
import { formatWorkspaceNodeStatusLabel } from "@/lib/workspace/status";
import type { AmountNodeType } from "@/mock-data/workspace/types";

const amountModes = ["percent", "fixed"] as const;

export const AmountNode = memo(
  ({ id, data, isConnectable }: NodeProps<AmountNodeType>) => {
    const builderContext = useWorkspaceBuilderContext();
    const isEditable = builderContext?.isEditable ?? false;

    return (
      <SurfaceCard className="w-[280px] bg-[#15202E]">
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
          <span className="text-foreground">{data.amountLabel}</span>
        </div>

        {isEditable ? (
          <div className="mb-3 space-y-2 border-t border-tidal-border/70 pt-3">
            <div className="tidal-text-caption text-tidal-muted">Amount setup</div>
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
                      draftState: {
                        hasChanges: true,
                        changedFields: Array.from(
                          new Set([
                            ...(currentData.draftState?.changedFields ?? []),
                            "amountMode",
                          ])
                        ),
                      },
                    };
                  })
                }
              />
              <input
                type="text"
                value={data.amountLabel}
                onChange={(event) =>
                  builderContext?.updateNodeData(id, (currentData) => {
                    if (currentData.nodeKind !== "amount") {
                      return currentData;
                    }

                    return {
                      ...currentData,
                      amountLabel: event.target.value,
                      outputs: currentData.outputs.map((output) => ({
                        ...output,
                        amountLabel: event.target.value,
                      })),
                      draftState: {
                        hasChanges: true,
                        changedFields: Array.from(
                          new Set([
                            ...(currentData.draftState?.changedFields ?? []),
                            "amount",
                          ])
                        ),
                      },
                    };
                  })
                }
                className="nodrag w-full rounded-md border border-tidal-border bg-background/40 px-2.5 py-2 text-xs text-foreground outline-none transition-colors focus:border-tidal-accent/40"
              />
            </div>
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
  }
);

AmountNode.displayName = "AmountNode";
