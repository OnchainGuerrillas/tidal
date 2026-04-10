"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import { Badge } from "@/components/tidal/badge";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { useAmplifyBuilderContext } from "@/features/amplify/components/amplify-builder-context";
import { formatAmplifyStatusLabel } from "@/features/amplify/lib/status";
import type { WalletNodeType } from "@/mock-data/amplify/types";

export const WalletNode = memo(
  ({ data, isConnectable }: NodeProps<WalletNodeType>) => {
    const builderContext = useAmplifyBuilderContext();
    const isEditable = builderContext?.isEditable ?? false;

    return (
      <SurfaceCard className="w-[280px] bg-[#15202E]" padding="none">
        <div className="border-b border-tidal-border px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="tidal-text-eyebrow">{data.title}</span>
            <Badge variant="status">{formatAmplifyStatusLabel(data.status)}</Badge>
          </div>
          <p className="tidal-text-caption text-tidal-muted">{data.description}</p>
        </div>

        <div className="divide-y divide-tidal-border/70">
          {data.assets.map((asset) => (
            <div key={asset.symbol} className="flex items-center justify-between px-4 py-3">
              <div className="space-y-1">
                <Badge variant="token" size="xs">
                  {asset.symbol}
                </Badge>
                <div className="tidal-text-caption text-foreground">
                  {asset.amountLabel}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="tidal-text-caption text-tidal-muted">
                  {asset.valueLabel}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={asset.outputId}
                  isConnectable={isConnectable}
                  aria-label={`${asset.symbol} output`}
                  className="!static h-4! w-4! shrink-0 cursor-crosshair rounded-full! border-2! border-tidal-accent! bg-tidal-card! transition-transform hover:scale-110"
                />
              </div>
            </div>
          ))}
        </div>

        {isEditable ? (
          <div className="border-t border-tidal-border px-4 py-3 tidal-text-caption text-tidal-muted">
            Drag from an asset circle to add the next node.
          </div>
        ) : null}

        {data.holdingsLabel ? (
          <div className="border-t border-tidal-border px-4 py-3 tidal-text-caption text-foreground">
            {data.holdingsLabel}
          </div>
        ) : null}
      </SurfaceCard>
    );
  }
);

WalletNode.displayName = "WalletNode";
