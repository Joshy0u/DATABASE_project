import { motion } from "framer-motion";
import { AppHeader } from "./components/layout/AppHeader";
import { ErrorAlert } from "./components/ErrorAlert";
import { ReservationSuccessBanner } from "./components/dashboard/ReservationSuccessBanner";
import { CreateReservationView } from "./components/reservations/CreateReservationView";
import { FloorPlan } from "./components/dashboard/FloorPlan";
import { useReservationDashboard } from "./hooks/useReservationDashboard";

/* ── helpers ──────────────────────────────────────────────────────── */
type RecordLike = Record<string, unknown>;

function valueFrom(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") return undefined;
  const item = record as RecordLike;
  return keys.map((k) => item[k]).find((v) => v !== undefined && v !== null);
}

function asNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value: unknown) {
  const raw = String(value ?? "");
  if (!raw) return "No date";
  const parsed = new Date(`${raw.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? raw
    : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(value: unknown) {
  const raw = String(value ?? "");
  if (!raw) return "--:--";
  const [hour = "0", minute = "00"] = raw.split(":");
  const d = new Date();
  d.setHours(Number(hour), Number(minute), 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function readableStatus(value: unknown) {
  const s = String(value ?? "unknown").toLowerCase();
  if (s.includes("seat") || s.includes("occup")) return "Seated";
  if (s.includes("confirm")) return "Confirmed";
  if (s.includes("book")) return "Booked";
  if (s.includes("cancel")) return "Cancelled";
  if (s.includes("complete")) return "Completed";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function statusClassName(status: string) {
  if (status === "Seated")
    return "border-emerald-700/50 bg-emerald-950/50 text-emerald-400";
  if (status === "Confirmed")
    return "border-blue-700/50 bg-blue-950/50 text-blue-400";
  if (status === "Booked")
    return "border-amber-700/50 bg-amber-950/50 text-amber-400";
  if (status === "Cancelled")
    return "border-red-700/50 bg-red-950/50 text-red-400";
  if (status === "Completed")
    return "border-slate-700/50 bg-slate-800/50 text-slate-400";
  return "border-slate-700/50 bg-slate-800/50 text-slate-400";
}

/* ── Unified Dashboard Pill ───────────────────────────────────────── */
function ReservationDashboard({
  customers,
  reservations,
  loading,
  onDeleteReservation,
  onUpdateStatus,
  onEditReservation,
}: {
  customers: unknown[];
  reservations: unknown[];
  loading?: boolean;
  onDeleteReservation?: (id: number) => void;
  onUpdateStatus?: (id: number, status: string) => void;
  onEditReservation?: (reservation: any) => void;
}) {
  const customersById = new Map(
    customers.map((c) => {
      const id = String(valueFrom(c, ["customer_id", "id"]) ?? "");
      const firstName = String(valueFrom(c, ["first_name", "firstName"]) ?? "");
      const lastName = String(valueFrom(c, ["last_name", "lastName"]) ?? "");
      const phone = String(valueFrom(c, ["phone", "phone_number"]) ?? "");
      return [
        id,
        { name: `${firstName} ${lastName}`.trim() || `Guest ${id}`, phone },
      ] as const;
    }),
  );

  const rows = reservations
    .map((r, i) => {
      const cid = String(valueFrom(r, ["customer_id", "customerId"]) ?? "");
      const guest = customersById.get(cid);
      const date = valueFrom(r, ["reservation_date", "date"]);
      const time = valueFrom(r, ["reservation_time", "time"]);
      const status = readableStatus(valueFrom(r, ["status", "table_status"]));
      const party = asNumber(valueFrom(r, ["party_size", "guests", "partySize"]));
      const id = String(valueFrom(r, ["reservation_id", "id"]) ?? i + 1);
      return {
        id,
        guestName: guest?.name || `Guest ${cid || i + 1}`,
        phone: guest?.phone,
        date,
        time,
        status,
        partySize: party,
        sortKey: `${String(date ?? "")} ${String(time ?? "")}`,
        raw: r,
      };
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const active = rows.filter(
    (r) => r.status !== "Cancelled" && r.status !== "Completed",
  );
  const totalGuests = active.reduce((s, r) => s + r.partySize, 0);
  const seatedCount = active.filter((r) => r.status === "Seated").length;
  const nextArrival = active[0];
  const lastUpdated = new Date().toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <section className="rounded-3xl border border-slate-700/80 bg-black shadow-sm overflow-hidden">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Host Station
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/50 bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <span className="text-xs text-slate-400">
            Updated {lastUpdated}
          </span>
        </div>

        {/* Stat Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
            <span className="font-bold text-white">{active.length}</span>
            Active
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
            <span className="font-bold text-white">{totalGuests}</span>
            Covers
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/50 bg-emerald-950/50 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="font-bold">{seatedCount}</span> Seated
          </span>
        </div>
      </div>

      {/* ── Next Arrival ────────────────────────────────────────── */}
      {nextArrival && (
        <div className="flex items-center gap-4 border-b border-slate-800 px-5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-16 shrink-0">
            Next Up
          </span>
          <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {formatTime(nextArrival.time)} &middot;{" "}
              {nextArrival.guestName}
              <span className="ml-2 font-normal text-slate-400">
                Party of {nextArrival.partySize}
              </span>
            </p>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusClassName(
                nextArrival.status,
              )}`}
            >
              {nextArrival.status}
            </span>
          </div>
        </div>
      )}

      {/* ── Unified List ────────────────────────────────────────── */}
      <div className="divide-y divide-slate-800 max-h-[65vh] overflow-y-auto">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            Loading reservations…
          </div>
        ) : active.length ? (
          active.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-800/80"
            >
              <div className="w-16 shrink-0">
                <p className="text-sm font-semibold tabular-nums text-white">
                  {formatTime(row.time)}
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatDate(row.date)}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {row.guestName}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Party of {row.partySize}
                  {row.phone ? ` · ${row.phone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {onUpdateStatus ? (
                  <select
                    value={row.status.toLowerCase()}
                    onChange={(e) => onUpdateStatus(Number(row.id), e.target.value)}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${statusClassName(
                      row.status,
                    )}`}
                    style={{ textAlignLast: "center", paddingRight: "0.625rem" }}
                  >
                    <option value="booked" className="bg-slate-900 text-amber-400">Booked</option>
                    <option value="confirmed" className="bg-slate-900 text-blue-400">Confirmed</option>
                    <option value="seated" className="bg-slate-900 text-emerald-400">Seated</option>
                    <option value="completed" className="bg-slate-900 text-slate-400">Completed</option>
                    <option value="cancelled" className="bg-slate-900 text-red-400">Cancelled</option>
                  </select>
                ) : (
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusClassName(
                      row.status,
                    )}`}
                  >
                    {row.status}
                  </span>
                )}
                {onEditReservation && (
                  <button
                    onClick={() => onEditReservation(row.raw)}
                    className="p-1 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
                    title="Edit reservation"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {onDeleteReservation && (
                  <button
                    onClick={() => onDeleteReservation(Number(row.id))}
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                    title="Remove reservation"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            No active reservations.
          </div>
        )}
      </div>
    </section>
  );
}

/* ── App ──────────────────────────────────────────────────────────── */
export function App() {
  const h = useReservationDashboard();
  const successMessage =
    h.submitNotice?.kind === "success" ? h.submitNotice.message : null;

  return (
    <div className="min-h-screen bg-black">
      <AppHeader
        page={h.page}
        loading={h.loading}
        onRefresh={h.refresh}
        onGoCreate={() => {
          h.resetFormToCreate();
        }}
        onGoDashboard={() => h.setPage("dashboard")}
        onGoFloorPlan={() => h.setPage("floorplan")}
      />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <motion.div
          key={h.page}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-6"
        >
          {h.error && <ErrorAlert message={h.error} />}
          {h.page === "dashboard" && successMessage && (
            <ReservationSuccessBanner message={successMessage} />
          )}
          {h.page === "create" ? (
            <CreateReservationView
              loading={h.loading}
              formMode={h.formMode}
              customers={h.customers}
              customerMode={h.customerMode}
              onCustomerModeChange={h.setCustomerMode}
              formCustomerId={h.formCustomerId}
              onFormCustomerIdChange={h.setFormCustomerId}
              formDate={h.formDate}
              onFormDateChange={h.setFormDate}
              formTime={h.formTime}
              onFormTimeChange={h.setFormTime}
              formPartySize={h.formPartySize}
              onFormPartySizeChange={h.setFormPartySize}
              formStatus={h.formStatus}
              onFormStatusChange={h.setFormStatus}
              newFirstName={h.newFirstName}
              onNewFirstNameChange={h.setNewFirstName}
              newLastName={h.newLastName}
              onNewLastNameChange={h.setNewLastName}
              newPhone={h.newPhone}
              onNewPhoneChange={h.setNewPhone}
              newEmail={h.newEmail}
              onNewEmailChange={h.setNewEmail}
              onSubmit={h.createReservationFromForm}
            />
          ) : h.page === "floorplan" ? (
            <FloorPlan />
          ) : (
            <ReservationDashboard
              customers={h.customers}
              reservations={h.reservations}
              loading={h.loading}
              onDeleteReservation={h.deleteReservationById}
              onUpdateStatus={h.updateReservationStatusById}
              onEditReservation={h.startEditReservation}
            />
          )}
        </motion.div>
      </main>
    </div>
  );
}
