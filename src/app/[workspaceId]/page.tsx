import { WorkspaceScreen } from "@/components/workspace/workspace-screen";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return <WorkspaceScreen workspaceId={workspaceId} />;
}
