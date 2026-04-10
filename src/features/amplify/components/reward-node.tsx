"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Timer } from "@phosphor-icons/react";

import { Badge } from "@/components/tidal/badge";
import { CompactSelect } from "@/components/tidal/compact-select";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { useAmplifyBuilderContext } from "@/features/amplify/components/amplify-builder-context";
import { formatAmplifyStatusLabel } from "@/features/amplify/lib/status";
import { collectIntervals, type RewardNodeType } from "@/mock-data/amplify/types";

export const RewardNode = memo(
  ({ id, data, isConnectable }: NodeProps<RewardNodeType>) => {
    const builderContext = useAmplifyBuilderContext();
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
          <Badge variant="status">{formatAmplifyStatusLabel(data.status)}</Badge>
        </div>

        <p className="mb-3 tidal-text-caption text-tidal-muted">{data.summary}</p>

        <div className="mb-3 flex items-center gap-2 tidal-text-caption">
          <Badge variant="token" size="xs">
            {data.rewardAsset}
          </Badge>
          <span className="text-foreground">{data.holdingsLabel}</span>
        </div>

        <div className="flex items-center gap-1.5 tidal-text-caption text-tidal-muted">
          <Timer weight="bold" className="h-3.5 w-3.5" />
          <span>{data.defaultInterval}</span>
        </div>

        {isEditable ? (
          <div className="mt-3 border-t border-tidal-border/70 pt-3">
            <div className="mb-2 tidal-text-caption text-tidal-muted">
              Collection cadence
            </div>
            <CompactSelect
              options={collectIntervals}
              value={data.defaultInterval}
              onChange={(nextInterval) =>
                builderContext?.updateNodeData(id, (currentData) => {
                  if (currentData.nodeKind !== "reward") {
                    return currentData;
                  }

                  return {
                    ...currentData,
                    defaultInterval: nextInterval,
                    outputs: currentData.outputs.map((output) => ({
                      ...output,
                      cadenceLabel: nextInterval,
                    })),
                    draftState: {
                      hasChanges: true,
                      changedFields: Array.from(
                        new Set([
                          ...(currentData.draftState?.changedFields ?? []),
                          "defaultInterval",
                        ])
                      ),
                    },
                  };
                })
              }
            />
          </div>
        ) : null}

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

RewardNode.displayName = "RewardNode";
