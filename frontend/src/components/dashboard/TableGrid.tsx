import { motion } from "framer-motion";
import type { Customer, Reservation } from "../../types/models";
import { formatMilitaryTime } from "../../lib/utils";

type TableGridProps = {
  customers: Customer[];
  reservations: Reservation[];
  loading: boolean;
};

function getCustomerName(customers: Customer[], customerId: number) {
  const customer = customers.find((entry) => entry.customer_id === customerId);
  if (!customer) {
    return `Customer #${customerId}`;
  }

  return `${customer.first_name} ${customer.last_name}`.trim();
}

function getStatusLabel(status: string | null) {
  const normalized = status?.trim().toLowerCase() ?? "";

  if (["booked", "confirmed", "pending", "reserved"].includes(normalized)) {
    return { label: "Reserved", tone: "border-amber-500/30 bg-amber-500/10 text-amber-200" };
  }

  if (["seated", "occupied"].includes(normalized)) {
    return { label: "Occupied", tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" };
  }

  if (["finished", "completed", "available"].includes(normalized)) {
    return { label: "Available", tone: "border-sky-500/30 bg-sky-500/10 text-sky-200" };
  }

  return {
    label: normalized ? normalized.replace(/\b\w/g, (match) => match.toUpperCase()) : "Unknown",
    tone: "border-zinc-700 bg-zinc-900/60 text-zinc-200",
  };
}

export function TableGrid({ customers, reservations, loading }: TableGridProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Table Status</h2>
          <p className="text-xs text-zinc-500">Live reservation cards from the current roster.</p>
        </div>
        <div className="text-xs text-zinc-500">{reservations.length} loaded</div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reservations.map((reservation, index) => {
          const status = getStatusLabel(reservation.status);
          return (
            <motion.article
              key={(reservation.reservation_id ?? `table-${index}`).toString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              className="rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-4 shadow-lg shadow-black/20"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Table {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-zinc-50">
                    {getCustomerName(customers, reservation.customer_id)}
                  </div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${status.tone}`}>
                  {status.label}
                </span>
              </div>

              <div className="space-y-3 text-sm text-zinc-300">
                <div className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-3 py-2">
                  <span className="text-zinc-500">Time</span>
                  <span className="font-medium text-zinc-100">{formatMilitaryTime(reservation.reservation_time)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-white/5 px-3 py-2">
                  <span className="text-zinc-500">Guests</span>
                  <span className="font-medium text-zinc-100">{reservation.party_size}</span>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-500">
                  Reservation date {reservation.reservation_date}
                </div>
              </div>
            </motion.article>
          );
        })}

        {reservations.length === 0 && !loading ? (
          <div className="col-span-full rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-sm text-zinc-500">
            No reservations returned.
          </div>
        ) : null}
      </div>
    </section>
  );
}