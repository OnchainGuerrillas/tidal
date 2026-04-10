import { AmplifyWorkspace } from "@/features/amplify/screens/amplify-workspace";

export default async function AmplifyWorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return <AmplifyWorkspace workspaceId={workspaceId} />;
}
