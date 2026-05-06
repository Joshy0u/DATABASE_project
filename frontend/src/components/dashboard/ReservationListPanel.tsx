import type { Reservation } from "../../types/models";
import { formatMilitaryTime } from "../../lib/utils";

type ReservationListPanelProps = {
  reservations: Reservation[];
  loading: boolean;
};

export function ReservationListPanel({
  reservations,
  loading,
}: ReservationListPanelProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">Reservations</h2>
        <div className="text-xs text-zinc-500">{reservations.length} loaded</div>
      </div>
      <div className="space-y-2">
        {reservations.slice(0, 10).map((r, idx) => (
          <div
            key={(r.reservation_id ?? `tmp-${idx}`).toString()}
            className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2"
          >
            <div className="text-sm text-zinc-100">
              {r.reservation_date} {formatMilitaryTime(r.reservation_time)} • party {r.party_size}
            </div>
            <div className="text-xs text-zinc-500">
              customer_id={r.customer_id}
              {r.status ? ` • ${r.status}` : ""}
              {r.reservation_id ? ` • id=${r.reservation_id}` : ""}
            </div>
          </div>
        ))}
        {reservations.length === 0 && !loading ? (
          <div className="text-sm text-zinc-500">No reservations returned.</div>
        ) : null}
      </div>
    </section>
  );
}
