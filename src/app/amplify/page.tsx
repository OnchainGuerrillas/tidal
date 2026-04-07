"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Edge,
  type OnConnect,
  BackgroundVariant,
  EdgeLabelRenderer,
  BaseEdge,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useSidebar } from "@/components/ui/sidebar";
import { StrategyNode } from "@/components/amplify/strategy-node";
import { SplitNode } from "@/components/amplify/split-node";
import { AmplifyChat } from "@/components/amplify/amplify-chat";
import {
  amplifyInitialEdges,
  amplifyInitialNodes,
  amplifyMessages,
  amplifySuggestions,
} from "@/features/amplify/mocks/workspace";

// Custom edge with asset label
function AssetEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps<Edge<{ asset: string }>>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan rounded bg-tidal-sidebar-active px-2 py-1 text-[10px] font-medium text-tidal-accent shadow-md shadow-black/20"
        >
          {data?.asset}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = {
  strategy: StrategyNode,
  split: SplitNode,
};
const edgeTypes = { asset: AssetEdge };

const STORAGE_KEY = "amplify-node-positions";

export default function AmplifyPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(amplifyInitialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(amplifyInitialEdges);
  const { setOpen } = useSidebar();

  const hasMounted = useRef(false);

  // Collapse sidebar on initial mount only + restore saved positions
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      setOpen(false);
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const positions: Record<string, { x: number; y: number }> =
          JSON.parse(saved);
        setNodes((nds) =>
          nds.map((node) =>
            positions[node.id]
              ? { ...node, position: positions[node.id] }
              : node
          )
        );
      }
    } catch {
      // ignore
    }
  }, [setNodes, setOpen]);

  // Save positions to localStorage when a drag ends
  const onNodeDragStop = useCallback(() => {
    setNodes((currentNodes) => {
      const positions: Record<string, { x: number; y: number }> = {};
      for (const node of currentNodes) {
        positions[node.id] = node.position;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
      return currentNodes;
    });
  }, [setNodes]);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="flex h-screen w-full">
      {/* Chat panel */}
      <div className="flex w-[35%] shrink-0 flex-col border-r border-tidal-border py-5">
        <AmplifyChat
          messages={amplifyMessages}
          suggestions={amplifySuggestions}
        />
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          colorMode="dark"
        >
          <Controls className="rounded-lg! border! border-tidal-border! bg-tidal-card! shadow-lg! shadow-black/20! [&>button]:border-tidal-border! [&>button]:bg-tidal-card! [&>button]:text-tidal-muted! [&>button:hover]:bg-tidal-sidebar-active! [&>button:hover]:text-tidal-accent!" />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#22292E"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
