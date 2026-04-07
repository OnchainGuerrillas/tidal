"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import type { SplitNodeType } from "@/features/amplify/types";

export const SplitNode = memo(
  ({ data, isConnectable }: NodeProps<SplitNodeType>) => {
    return (
      <div className="w-[180px] rounded-lg border border-tidal-border bg-tidal-card p-4 shadow-lg shadow-black/20">
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="h-3! w-3! rounded-full! border-2! border-tidal-accent! bg-tidal-card!"
        />

        {/* Header */}
        <div className="mb-3 text-xs font-semibold text-tidal-accent">
          Split {data.asset}
        </div>

        {/* Visual split bar */}
        <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full">
          <div
            className="bg-tidal-accent"
            style={{ width: `${data.splitA}%` }}
          />
          <div
            className="bg-emerald-400"
            style={{ width: `${data.splitB}%` }}
          />
        </div>

        {/* Labels */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-tidal-accent" />
              <span className="text-foreground">Path A</span>
            </span>
            <span className="font-semibold text-tidal-accent">
              {data.splitA}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-foreground">Path B</span>
            </span>
            <span className="font-semibold text-emerald-400">
              {data.splitB}%
            </span>
          </div>
        </div>

        {/* Source handles — top and bottom on right side */}
        <Handle
          type="source"
          position={Position.Right}
          id="a"
          isConnectable={isConnectable}
          className="h-3! w-3! rounded-full! border-2! border-tidal-accent! bg-tidal-card!"
          style={{ top: "30%" }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="b"
          isConnectable={isConnectable}
          className="h-3! w-3! rounded-full! border-2! border-emerald-400! bg-tidal-card!"
          style={{ top: "70%" }}
        />
      </div>
    );
  }
);

SplitNode.displayName = "SplitNode";
