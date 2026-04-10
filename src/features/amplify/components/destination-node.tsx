"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import { Badge } from "@/components/tidal/badge";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { formatAmplifyStatusLabel } from "@/features/amplify/lib/status";
import type { DestinationNodeType } from "@/mock-data/amplify/types";

export const DestinationNode = memo(
  ({ data, isConnectable }: NodeProps<DestinationNodeType>) => {
    return (
      <SurfaceCard className="w-[280px] bg-[#15202E]">
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="h-3! w-3! rounded-full! border-2! border-tidal-accent! bg-tidal-card!"
        />

        <div className="mb-3 flex items-center justify-between">
          <span className="tidal-text-eyebrow">{data.destinationLabel}</span>
          <Badge variant="status">{formatAmplifyStatusLabel(data.status)}</Badge>
        </div>

        <div className="mb-3 tidal-text-body">{data.title}</div>
        <p className="mb-3 tidal-text-caption text-tidal-muted">{data.summary}</p>

        <Badge variant="token" size="xs">
          {data.asset}
        </Badge>
      </SurfaceCard>
    );
  }
);

DestinationNode.displayName = "DestinationNode";
