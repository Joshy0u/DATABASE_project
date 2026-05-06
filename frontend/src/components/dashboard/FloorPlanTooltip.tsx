import { motion, AnimatePresence } from "framer-motion";
import type { FloorPlanTable } from "../../types/models";
import { formatMilitaryTime } from "../../lib/utils";

type FloorPlanTooltipProps = {
  table: FloorPlanTable | null;
  x: number;
  y: number;
  visible: boolean;
};

const STATUS_BORDER: Record<string, string> = {
  empty: "border-emerald-500/40",
  seated: "border-red-500/40",
  reserved: "border-amber-500/40",
};

const STATUS_GLOW: Record<string, string> = {
  empty: "shadow-emerald-500/10",
  seated: "shadow-red-500/10",
  reserved: "shadow-amber-500/10",
};

export function FloorPlanTooltip({ table, x, y, visible }: FloorPlanTooltipProps) {
  return (
    <AnimatePresence>
      {visible && table ? (
        <motion.div
          key="floor-tooltip"
          initial={{ opacity: 0, scale: 0.92, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={`pointer-events-none fixed z-50 min-w-[220px] rounded-2xl border ${STATUS_BORDER[table.status]} bg-zinc-900/90 p-4 shadow-xl ${STATUS_GLOW[table.status]} backdrop-blur-xl`}
          style={{
            left: x + 16,
            top: y - 10,
          }}
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
              Table {String(table.table_number).padStart(2, "0")}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                table.status === "seated"
                  ? "bg-red-500/20 text-red-300"
                  : table.status === "reserved"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {table.status}
            </span>
          </div>

          {/* Content */}
          {table.status === "seated" && table.visit ? (
            <div className="space-y-2">
              <Row label="Guest" value={table.visit.customer_name} />
              <Row label="Party" value={String(table.visit.party_size)} />
              <Row label="Arrived" value={formatMilitaryTime(table.visit.arrival_time)} />
              <Row
                label="Staff"
                value={
                  table.visit.staff_name +
                  (table.visit.staff_role ? ` · ${table.visit.staff_role}` : "")
                }
              />
            </div>
          ) : table.status === "reserved" && table.reservation ? (
            <div className="space-y-2">
              <Row label="Guest" value={table.reservation.customer_name} />
              <Row label="Party" value={String(table.reservation.party_size)} />
              <Row label="Date" value={table.reservation.reservation_date} />
              <Row label="Time" value={formatMilitaryTime(table.reservation.reservation_time)} />
            </div>
          ) : (
            <div className="text-xs text-zinc-500">
              Capacity: {table.capacity} seats — No current activity
            </div>
          )}

          {/* Capacity footer */}
          <div className="mt-3 border-t border-white/5 pt-2 text-[10px] text-zinc-600">
            {table.capacity} seat capacity
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-200">{value}</span>
    </div>
  );
}
