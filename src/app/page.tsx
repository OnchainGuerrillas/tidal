"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useWorkspace } from "@/providers/workspace-provider";
import { getWorkspaceHref } from "@/lib/routes/workspace";
import { WorkspaceScreen } from "@/components/workspace/workspace-screen";

export default function RootPage() {
  const router = useRouter();
  const { workspace } = useWorkspace();

  useEffect(() => {
    router.replace(getWorkspaceHref(workspace.id));
  }, [router, workspace.id]);

  return <WorkspaceScreen workspaceId={workspace.id} />;
}
