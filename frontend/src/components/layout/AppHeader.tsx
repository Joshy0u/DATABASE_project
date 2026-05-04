import { Button } from "../ui/button";
import type { AppPage } from "../../types/models";

type AppHeaderProps = {
  page: AppPage;
  loading: boolean;
  onRefresh: () => void;
  onGoCreate: () => void;
  onGoDashboard: () => void;
};

export function AppHeader({
  page,
  loading,
  onRefresh,
  onGoCreate,
  onGoDashboard,
}: AppHeaderProps) {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div>
          <div className="text-sm text-zinc-400">
            React + shadcn-style + Framer Motion
          </div>
          <div className="text-lg font-semibold">
            {page === "dashboard" ? "Reservations Dashboard" : "Create Reservation"}
          </div>
        </div>
        <div className="flex gap-2">
          {page === "dashboard" ? (
            <>
              <Button variant="secondary" onClick={onRefresh} disabled={loading}>
                Refresh
              </Button>
              <Button onClick={onGoCreate}>Create Reservation</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={onGoDashboard}>
              Back to Dashboard
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
