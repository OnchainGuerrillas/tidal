import type { Edge } from "@xyflow/react";

import type {
  WorkspaceGraphEdge,
  WorkspaceGraphNode,
  WorkspaceNodeOutput,
} from "@/mock-data/workspace/types";

export const mainEdgeStyle = { stroke: "#61B3CF", strokeWidth: 2 };

export function cloneGraphNode<TNode extends WorkspaceGraphNode>(node: TNode): TNode {
  return {
    ...node,
    position: { ...node.position },
    data: { ...node.data },
  };
}

export function cloneGraphEdge(edge: WorkspaceGraphEdge): WorkspaceGraphEdge {
  return {
    ...edge,
    style: edge.style ? { ...edge.style } : undefined,
    data: edge.data ? { ...edge.data } : undefined,
  };
}

export function getOutputById(
  node: WorkspaceGraphNode | undefined,
  outputId?: string | null
): WorkspaceNodeOutput | null {
  if (!node) {
    return null;
  }

  if (!outputId) {
    return node.data.outputs[0] ?? null;
  }

  return node.data.outputs.find((output) => output.id === outputId) ?? null;
}

export function applySourceAssetToNode(
  node: WorkspaceGraphNode,
  sourceAsset: string
): WorkspaceGraphNode {
  if (node.type === "amount") {
    return {
      ...node,
      data: {
        ...node.data,
        title: `${sourceAsset} amount`,
        summary: `Choose how much ${sourceAsset} to route into the next node.`,
        acceptedAssets: [sourceAsset],
        outputs: node.data.outputs.map((output) => ({
          ...output,
          asset: sourceAsset,
          amountLabel: `Custom ${sourceAsset}`,
        })),
        holdingsLabel: `Awaiting ${sourceAsset} input`,
        sourceAsset,
        amountLabel: `50% ${sourceAsset}`,
        maxAmountLabel: `Max ${sourceAsset}`,
      },
    };
  }

  if (node.type === "split") {
    return {
      ...node,
      data: {
        ...node.data,
        title: `${sourceAsset} split`,
        summary: `Branch ${sourceAsset} across two downstream paths.`,
        acceptedAssets: [sourceAsset],
        outputs: node.data.outputs.map((output) => ({
          ...output,
          asset: `50% ${sourceAsset}`,
        })),
        holdingsLabel: `${sourceAsset} ready to route`,
        asset: sourceAsset,
      },
    };
  }

  if (node.type === "reward") {
    return {
      ...node,
      data: {
        ...node.data,
        summary: `Collect and route ${sourceAsset} before sending it onward.`,
        acceptedAssets: [sourceAsset],
        outputs: node.data.outputs.map((output) => ({
          ...output,
          asset: sourceAsset,
        })),
        holdingsLabel: `${sourceAsset} ready to collect`,
        rewardAsset: sourceAsset,
      },
    };
  }

  if (node.type === "destination") {
    return {
      ...node,
      data: {
        ...node.data,
        summary: `Send ${sourceAsset} back to wallet.`,
        acceptedAssets: [sourceAsset],
        holdingsLabel: `Ready to receive ${sourceAsset}`,
        asset: sourceAsset,
      },
    };
  }

  return node;
}

export function canConnectAssetToNode(asset: string, node: WorkspaceGraphNode) {
  return node.data.acceptedAssets.includes(asset);
}

export function canConnectOutputToNode(output: WorkspaceNodeOutput, node: WorkspaceGraphNode) {
  return (
    output.compatibleNodeTypes.includes(node.data.nodeKind) &&
    canConnectAssetToNode(output.asset, node)
  );
}

export function getDescendantNodeIds(nodeIds: string[], edges: WorkspaceGraphEdge[]) {
  const queue = [...nodeIds];
  const seen = new Set<string>(nodeIds);
  const descendants = new Set<string>();

  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    if (!currentNodeId) {
      continue;
    }

    for (const edge of edges) {
      if (edge.source !== currentNodeId || seen.has(edge.target)) {
        continue;
      }

      seen.add(edge.target);
      descendants.add(edge.target);
      queue.push(edge.target);
    }
  }

  return Array.from(descendants);
}

export function buildAssetEdge(
  sourceNodeId: string,
  sourceHandleId: string | null | undefined,
  targetNodeId: string,
  asset: string
): WorkspaceGraphEdge {
  return {
    id: `e-${sourceNodeId}-${sourceHandleId ?? "next"}-${targetNodeId}`,
    source: sourceNodeId,
    sourceHandle: sourceHandleId ?? undefined,
    target: targetNodeId,
    type: "asset",
    data: { asset },
    style: mainEdgeStyle,
    animated: true,
  };
}

export function getClientPosition(event: MouseEvent | TouchEvent) {
  if ("changedTouches" in event && event.changedTouches.length > 0) {
    return {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    };
  }

  const mouseEvent = event as MouseEvent;
  return {
    x: mouseEvent.clientX,
    y: mouseEvent.clientY,
  };
}

export function buildWorkspaceTimestampLabel() {
  return `Updated ${new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date())}`;
}

export function toNodeMap(nodes: WorkspaceGraphNode[]) {
  return new Map(nodes.map((node) => [node.id, node] as const));
}

export function buildActiveHoldingsLabel(
  node: WorkspaceGraphNode,
  incomingOutput: WorkspaceNodeOutput | null,
  incomingEdge: WorkspaceGraphEdge | undefined
) {
  const amountLabel =
    incomingOutput?.amountLabel ??
    incomingEdge?.data?.asset ??
    incomingOutput?.asset ??
    node.data.holdingsLabel;

  switch (node.type) {
    case "amount":
      return `${node.data.amountLabel} ready to route`;
    case "strategy":
      return amountLabel
        ? `${amountLabel} active on ${node.data.protocol}`
        : `${node.data.protocol} position active`;
    case "split":
      return amountLabel ? `${amountLabel} routed across both paths` : "Branch active";
    case "reward":
      return amountLabel
        ? `${amountLabel} collecting ${node.data.defaultInterval.toLowerCase()}`
        : `Collecting ${node.data.defaultInterval.toLowerCase()}`;
    case "destination":
      return amountLabel ? `${amountLabel} returning to wallet` : "Destination armed";
    case "wallet":
      return node.data.holdingsLabel;
  }

  return undefined;
}

export type AssetEdgeProps = Edge<{ asset: string }>;
