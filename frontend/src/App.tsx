import { motion } from "framer-motion";
import { AppHeader } from "./components/layout/AppHeader";
import { ErrorAlert } from "./components/ErrorAlert";
import { DashboardView } from "./components/dashboard/DashboardView";
import { ReservationSuccessBanner } from "./components/dashboard/ReservationSuccessBanner";
import { CreateReservationView } from "./components/reservations/CreateReservationView";
import { useReservationDashboard } from "./hooks/useReservationDashboard";

type RecordLike = Record<string, unknown>;

type ReservationSnapshotProps = {
  customers: unknown[];
  reservations: unknown[];
};

function valueFrom(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") return undefined;
  const item = record as RecordLike;
  return keys.map((key) => item[key]).find((value) => value !== undefined && value !== null);
}

function asNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatDate(value: unknown) {
  const raw = String(value ?? "");
  if (!raw) return "No date";
  const parsed = new Date(`${raw.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(value: unknown) {
  const raw = String(value ?? "");
  if (!raw) return "--:--";
  const [hour = "0", minute = "00"] = raw.split(":");
  const parsed = new Date();
  parsed.setHours(Number(hour), Number(minute), 0, 0);
  return parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function readableStatus(value: unknown) {
  const status = String(value ?? "unknown").toLowerCase();
  if (status.includes("seat") || status.includes("occup")) return "Seated";
  if (status.includes("confirm")) return "Confirmed";
  if (status.includes("book")) return "Booked";
  if (status.includes("cancel")) return "Cancelled";
  if (status.includes("complete")) return "Completed";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClassName(status: string) {
  if (status === "Seated") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Confirmed") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "Booked") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "Cancelled") return "border-red-200 bg-red-50 text-red-700";
  if (status === "Completed") return "border-slate-200 bg-slate-50 text-slate-500";
  return "border-slate-300 bg-white text-slate-600";
}

function ReservationSnapshot({ customers, reservations }: ReservationSnapshotProps) {
  const customersById = new Map(
    customers.map((customer) => {
      const id = String(valueFrom(customer, ["customer_id", "id"]) ?? "");
      const firstName = String(valueFrom(customer, ["first_name", "firstName"]) ?? "");
      const lastName = String(valueFrom(customer, ["last_name", "lastName"]) ?? "");
      const phone = String(valueFrom(customer, ["phone", "phone_number"]) ?? "");
      return [id, { name: `${firstName} ${lastName}`.trim() || `Guest ${id}`, phone }] as const;
    }),
  );

  const rows = reservations
    .map((reservation, index) => {
      const customerId = String(valueFrom(reservation, ["customer_id", "customerId"]) ?? "");
      const guest = customersById.get(customerId);
      const date = valueFrom(reservation, ["reservation_date", "date"]);
      const time = valueFrom(reservation, ["reservation_time", "time"]);
      const status = readableStatus(valueFrom(reservation, ["status", "table_status"]));
      const partySize = asNumber(valueFrom(reservation, ["party_size", "guests", "partySize"]));
      const id = String(valueFrom(reservation, ["reservation_id", "id"]) ?? index + 1);

      return {
        id,
        guestName: guest?.name || `Guest ${customerId || index + 1}`,
        phone: guest?.phone,
        date,
        time,
        status,
        partySize,
        sortKey: `${String(date ?? "")} ${String(time ?? "")}`,
      };
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const activeRows = rows.filter((row) => row.status !== "Cancelled" && row.status !== "Completed");
  const totalReservations = activeRows.length;
  const totalGuests = activeRows.reduce((sum, row) => sum + row.partySize, 0);
  const seatedCount = activeRows.filter((row) => row.status === "Seated").length;
  const nextThree = activeRows.slice(0, 3);
  const nextArrival = activeRows[0];
  const lastUpdated = new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const stats = [
    { label: "Active", value: totalReservations, helper: "reservations" },
    { label: "Covers", value: totalGuests, helper: "expected guests" },
    { label: "Seated", value: seatedCount, helper: "active parties" },
    { label: "Customers", value: customers.length, helper: "guest profiles" },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Host Station</p>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Updated {lastUpdated}
            </span>
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Reservation board</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Monitor upcoming reservations, expected covers, seated parties, and guest details from one place.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:min-w-72">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next Arrival</p>
          {nextArrival ? (
            <div className="mt-1">
              <p className="font-semibold text-slate-950">{formatTime(nextArrival.time)} · {nextArrival.guestName}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-slate-500">Party of {nextArrival.partySize}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusClassName(nextArrival.status)}`}>
                  {nextArrival.status}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-slate-500">No reservations yet</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="font-semibold text-slate-950">Upcoming arrivals</h3>
            <p className="text-sm text-slate-500">Showing the next {nextThree.length} of {activeRows.length} active reservations.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {nextThree.length ? (
            nextThree.map((row) => (
              <div key={row.id} className="grid gap-3 px-4 py-4 transition hover:bg-slate-50 md:grid-cols-[120px_1fr_auto] md:items-center">
                <div>
                  <p className="font-semibold text-slate-950">{formatTime(row.time)}</p>
                  <p className="text-sm text-slate-500">{formatDate(row.date)}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-950">{row.guestName}</p>
                  <p className="text-sm text-slate-500">
                    Party of {row.partySize}{row.phone ? ` · ${row.phone}` : ""}
                  </p>
                </div>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClassName(row.status)}`}>
                  {row.status}
                </span>
              </div>
            ))
          ) : (
            <p className="px-4 py-6 text-sm text-slate-500">No reservations available.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function App() {
  const h = useReservationDashboard();
  const successMessage =
    h.submitNotice?.kind === "success" ? h.submitNotice.message : null;

  return (
    <div className="min-h-screen">
      <AppHeader
        page={h.page}
        loading={h.loading}
        onRefresh={h.refresh}
        onGoCreate={() => {
          h.clearReservationSubmitNotice();
          h.setPage("create");
        }}
        onGoDashboard={() => h.setPage("dashboard")}
      />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <motion.div
          key={h.page}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-6"
        >
          {h.error ? <ErrorAlert message={h.error} /> : null}

          {h.page === "dashboard" && successMessage ? (
            <ReservationSuccessBanner message={successMessage} />
          ) : null}

          {h.page === "create" ? (
            <CreateReservationView
              loading={h.loading}
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
              submitNotice={h.submitNotice}
            />
          ) : (
            <>
              <ReservationSnapshot customers={h.customers} reservations={h.reservations} />
              <DashboardView
                customers={h.customers}
                reservations={h.reservations}
                loading={h.loading}
              />
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
