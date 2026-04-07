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
  type StrategyNodeType,
} from "@/features/amplify/types";

export const StrategyNode = memo(
  ({ data, isConnectable }: NodeProps<StrategyNodeType>) => {
    const [interval, setInterval] = useState(
      data.collectInterval ?? "Weekly"
    );
    const showCollector = data.apyType === "earn";

    return (
      <div className="w-[220px] rounded-lg border border-tidal-border bg-tidal-card shadow-lg shadow-black/20">
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="h-3! w-3! rounded-full! border-2! border-tidal-accent! bg-tidal-card!"
        />

        <div className="p-4">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-tidal-accent">
              {data.protocol}
            </span>
            <span className="rounded-full bg-tidal-accent/10 px-2 py-0.5 text-[10px] font-medium text-tidal-accent">
              Active
            </span>
          </div>

          {/* Action */}
          <div className="mb-3 text-[11px] font-medium text-foreground">
            {data.action}
          </div>

          {/* Asset flow */}
          <div className="mb-3 flex items-center gap-2 text-[10px] text-tidal-muted">
            <span className="rounded bg-tidal-sidebar-active px-1.5 py-0.5 text-foreground">
              {data.assetIn}
            </span>
            <svg
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M1 4h10M8 1l3 3-3 3"
                stroke="#657F92"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="rounded bg-tidal-sidebar-active px-1.5 py-0.5 text-foreground">
              {data.assetOut}
            </span>
          </div>

          {/* APY */}
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold ${
                data.apyType === "earn" ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {data.apy}
            </span>
            <span className="text-[10px] text-tidal-muted">
              {data.apyType === "earn" ? "APY" : "Borrow Cost"}
            </span>
          </div>
        </div>

        {/* Fee collector section */}
        {showCollector && (
          <div className="border-t border-tidal-border px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Timer weight="bold" className="h-3 w-3 text-tidal-muted" />
              <span className="text-[10px] font-semibold text-tidal-muted">
                Fee Collector
              </span>
            </div>
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
        )}

        <Handle
          type="source"
          position={Position.Right}
          id="next"
          isConnectable={isConnectable}
          className="h-3! w-3! rounded-full! border-2! border-tidal-accent! bg-tidal-card!"
        />
      </div>
    );
  }
);

StrategyNode.displayName = "StrategyNode";
