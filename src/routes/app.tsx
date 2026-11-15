import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { AppShell } from "@/components/sans/AppShell";
import { ErrorState, LoadingState, Panel } from "@/components/sans/ui";
import { SansProvider, useSans } from "@/lib/sans/store";
import { HOME, WORKSPACES, canAccess, lockedAstronaut, useWorkspace } from "@/lib/sans/workspace";

export const Route = createFileRoute("/app")({ component: AppLayout });

function Gate() {
  const { data, isLoading, error, refetch, setMode } = useSans();
  const { role } = useWorkspace();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (!canAccess(role, path)) return <NotInWorkspace />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} onDemo={() => setMode("demo")} />;
  if (isLoading || !data) return <LoadingState />;
  return <Outlet />;
}

function NotInWorkspace() {
  const { role } = useWorkspace();
  const ws = WORKSPACES[role];
  return (
    <Panel className="mx-auto max-w-xl text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-border bg-muted/50"><Lock className="h-5 w-5 text-muted-foreground" /></span>
      <h1 className="mt-4 font-display text-xl font-semibold">Not part of the {ws.label} workspace</h1>
      <p className="mt-2 text-sm text-muted-foreground">This page belongs to a different workspace. Go to your dashboard, or switch workspace to open it.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link to={HOME[role]} className="rounded-md bg-cta px-4 py-2 text-sm font-medium text-primary-foreground">Go to {ws.title}</Link>
        <Link to="/workspace" className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/50">Back to Workspace Selection</Link>
      </div>
    </Panel>
  );
}

function AppLayout() {
  const { ready, role } = useWorkspace();
  // The chosen workspace is stored in this browser; wait for it so no other astronaut's data flashes.
  if (!ready) return <div className="min-h-screen bg-background"><LoadingState /></div>;
  return (
    <SansProvider lockedAstronautId={lockedAstronaut(role)}>
      <AppShell><Gate /></AppShell>
    </SansProvider>
  );
}
