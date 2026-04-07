"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Timer } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  collectIntervals,
  type CollectorNodeType,
} from "@/features/amplify/types";

export const CollectorNode = memo(
  ({ data, isConnectable }: NodeProps<CollectorNodeType>) => {
    const [interval, setInterval] = useState(data.defaultInterval);

    return (
      <div className="w-[160px] rounded-lg border border-tidal-border/60 bg-tidal-card/80 p-3 shadow-md shadow-black/20">
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="h-2.5! w-2.5! rounded-full! border-2! border-tidal-muted! bg-tidal-card!"
        />

        {/* Header */}
        <div className="mb-2 flex items-center gap-1.5">
          <Timer weight="bold" className="h-3.5 w-3.5 text-tidal-muted" />
          <span className="text-[10px] font-semibold text-tidal-muted">
            Fee Collector
          </span>
        </div>

        {/* Interval dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="nodrag flex w-full cursor-pointer items-center justify-between rounded-[4px] border border-tidal-border bg-tidal-sidebar-active px-2 py-1.5 outline-none">
            <span className="text-[10px] font-medium text-foreground">
              {interval}
            </span>
            <svg
              width="7"
              height="4"
              viewBox="0 0 8 5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L4 4L7 1"
                stroke="#657F92"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="bottom"
            sideOffset={4}
            className="min-w-[120px] rounded-[4px] border border-tidal-border bg-tidal-card"
          >
            {collectIntervals.map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => setInterval(option)}
                className="cursor-pointer text-[10px] text-tidal-accent"
              >
                {option}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
);

CollectorNode.displayName = "CollectorNode";
