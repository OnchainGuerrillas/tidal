"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import { Badge } from "@/components/tidal/badge";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { useAmplifyBuilderContext } from "@/features/amplify/components/amplify-builder-context";
import { formatAmplifyStatusLabel } from "@/features/amplify/lib/status";
import type { SplitNodeType } from "@/mock-data/amplify/types";

export const SplitNode = memo(
  ({ id, data, isConnectable }: NodeProps<SplitNodeType>) => {
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
          <div className="tidal-text-eyebrow">Split {data.asset}</div>
          <Badge variant="status">{formatAmplifyStatusLabel(data.status)}</Badge>
        </div>

        <p className="mb-3 tidal-text-caption text-tidal-muted">{data.summary}</p>

        <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full">
          <div className="bg-tidal-accent" style={{ width: `${data.splitA}%` }} />
          <div className="bg-emerald-400" style={{ width: `${data.splitB}%` }} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 tidal-text-caption">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-tidal-accent" />
              <span className="text-foreground">Path A</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-tidal-accent">{data.splitA}%</span>
              <Handle
                type="source"
                position={Position.Right}
                id="a"
                isConnectable={isConnectable}
                aria-label="Split path A output"
                className="!static h-3.5! w-3.5! shrink-0 cursor-crosshair rounded-full! border-2! border-tidal-accent! bg-tidal-card! transition-transform hover:scale-110"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 tidal-text-caption">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-foreground">Path B</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-400">{data.splitB}%</span>
              <Handle
                type="source"
                position={Position.Right}
                id="b"
                isConnectable={isConnectable}
                aria-label="Split path B output"
                className="!static h-3.5! w-3.5! shrink-0 cursor-crosshair rounded-full! border-2! border-emerald-400! bg-tidal-card! transition-transform hover:scale-110"
              />
            </div>
          </div>
        </div>

        {isEditable ? (
          <div className="space-y-2">
            <div className="tidal-text-caption text-tidal-muted">
              Drag from either path circle to continue routing.
            </div>
            <div className="space-y-2 border-t border-tidal-border/70 pt-3">
              <div className="flex items-center justify-between tidal-text-caption text-tidal-muted">
                <span>Path balance</span>
                <span>{data.splitA}% / {data.splitB}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={data.splitA}
                onChange={(event) =>
                  builderContext?.updateNodeData(id, (currentData) => {
                    if (currentData.nodeKind !== "split") {
                      return currentData;
                    }

                    const nextSplitA = Number(event.target.value);
                    const nextSplitB = 100 - nextSplitA;

                    return {
                      ...currentData,
                      splitA: nextSplitA,
                      splitB: nextSplitB,
                      outputs: currentData.outputs.map((output) => ({
                        ...output,
                        asset:
                          output.id === "a"
                            ? `${nextSplitA}% ${currentData.asset}`
                            : `${nextSplitB}% ${currentData.asset}`,
                      })),
                      draftState: {
                        hasChanges: true,
                        changedFields: Array.from(
                          new Set([
                            ...(currentData.draftState?.changedFields ?? []),
                            "split",
                          ])
                        ),
                      },
                    };
                  })
                }
                className="nodrag w-full accent-[#61B3CF]"
              />
            </div>
          </div>
        ) : null}

        {data.holdingsLabel ? (
          <div className="tidal-text-caption text-foreground">{data.holdingsLabel}</div>
        ) : null}
      </SurfaceCard>
    );
  }
);

SplitNode.displayName = "SplitNode";
