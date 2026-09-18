import WorkspacePage from '../page';

export default async function DynamicWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkspacePage workspaceId={id} />;
}
