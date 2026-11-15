import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/sans/AppShell";
import { ErrorState, LoadingState } from "@/components/sans/ui";
import { SansProvider, useSans } from "@/lib/sans/store";

export const Route = createFileRoute("/app")({ component: AppLayout });

function Gate() {
  const { data, isLoading, error, refetch, setMode } = useSans();
  if (error) return <ErrorState message={error.message} onRetry={refetch} onDemo={() => setMode("demo")} />;
  if (isLoading || !data) return <LoadingState />;
  return <Outlet />;
}

function AppLayout() {
  return (
    <SansProvider>
      <AppShell><Gate /></AppShell>
    </SansProvider>
  );
}
