import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./components/ui/button";

type Customer = {
  customer_id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
};

type Reservation = {
  reservation_id?: number;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string | null;
  customer_id: number;
};

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || "http://127.0.0.1:5000";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstCustomerId = useMemo(() => customers[0]?.customer_id, [customers]);
  const [formCustomerId, setFormCustomerId] = useState<number | "">("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formTime, setFormTime] = useState("18:30");
  const [formPartySize, setFormPartySize] = useState(2);
  const [formStatus, setFormStatus] = useState("booked");
  const [page, setPage] = useState<"dashboard" | "create">("dashboard");
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [c, r] = await Promise.all([
        apiGet<{ items: Customer[] }>("/api/customers?limit=25"),
        apiGet<{ items: Reservation[] }>("/api/reservations?limit=25"),
      ]);
      setCustomers(c.items);
      setReservations(r.items);
      if (formCustomerId === "" && c.items.length > 0) {
        setFormCustomerId(c.items[0].customer_id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function createReservationFromForm() {
    setLoading(true);
    setError(null);
    try {
      let customerId: number | undefined =
        customerMode === "existing" ? Number(formCustomerId || firstCustomerId) : undefined;

      if (customerMode === "new") {
        if (!newFirstName.trim() || !newLastName.trim()) {
          throw new Error("New customer requires first and last name.");
        }
        const createdCustomer = await apiPost<{ item: Customer }>("/api/customers", {
          first_name: newFirstName.trim(),
          last_name: newLastName.trim(),
          phone: newPhone.trim() || null,
          email: newEmail.trim() || null,
        });
        customerId = createdCustomer.item.customer_id;
      }

      if (!customerId) {
        throw new Error("No customer selected.");
      }

      await apiPost("/api/reservations", {
        reservation_date: formDate,
        reservation_time: `${formTime}:00`,
        party_size: formPartySize,
        status: formStatus,
        customer_id: customerId,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-sm text-zinc-400">React + shadcn-style + Framer Motion</div>
            <div className="text-lg font-semibold">
              {page === "dashboard" ? "Reservations Dashboard" : "Create Reservation"}
            </div>
          </div>
          <div className="flex gap-2">
            {page === "dashboard" ? (
              <>
                <Button variant="secondary" onClick={refresh} disabled={loading}>
                  Refresh
                </Button>
                <Button onClick={() => setPage("create")}>Create Reservation</Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setPage("dashboard")}>
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-6"
        >
          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {page === "create" ? (
            <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
              <div className="mb-3 text-sm font-semibold text-zinc-200">Create reservation</div>
              <div className="mb-3 flex gap-2">
                <Button
                  variant={customerMode === "existing" ? "default" : "secondary"}
                  onClick={() => setCustomerMode("existing")}
                  disabled={loading}
                >
                  Existing customer
                </Button>
                <Button
                  variant={customerMode === "new" ? "default" : "secondary"}
                  onClick={() => setCustomerMode("new")}
                  disabled={loading}
                >
                  New customer
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                {customerMode === "existing" ? (
                  <select
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    value={formCustomerId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormCustomerId(value ? Number(value) : "");
                    }}
                  >
                    {customers.length === 0 ? <option value="">No customers</option> : null}
                    {customers.map((c) => (
                      <option key={c.customer_id} value={c.customer_id}>
                        {c.first_name} {c.last_name} (id {c.customer_id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    type="text"
                    placeholder="First name"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                  />
                )}
                {customerMode === "new" ? (
                  <input
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    type="text"
                    placeholder="Last name"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                  />
                ) : (
                  <input
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-500"
                    type="text"
                    value="Using existing customer"
                    disabled
                  />
                )}
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  type="number"
                  min={1}
                  value={formPartySize}
                  onChange={(e) => setFormPartySize(Number(e.target.value))}
                />
                <select
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                >
                  <option value="booked">booked</option>
                  <option value="confirmed">confirmed</option>
                  <option value="seated">seated</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              {customerMode === "new" ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    type="text"
                    placeholder="Phone (optional)"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                  <input
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    type="email"
                    placeholder="Email (optional)"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              ) : null}
              <div className="mt-3">
                <Button onClick={createReservationFromForm} disabled={loading}>
                  Submit Reservation
                </Button>
              </div>
            </section>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-200">Customers</h2>
                <div className="text-xs text-zinc-500">{customers.length} loaded</div>
              </div>
              <div className="space-y-2">
                {customers.slice(0, 10).map((c) => (
                  <div
                    key={c.customer_id}
                    className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2"
                  >
                    <div className="text-sm text-zinc-100">
                      {c.first_name} {c.last_name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      id={c.customer_id}
                      {c.email ? ` • ${c.email}` : ""}
                      {c.phone ? ` • ${c.phone}` : ""}
                    </div>
                  </div>
                ))}
                {customers.length === 0 && !loading ? (
                  <div className="text-sm text-zinc-500">
                    No customers returned. Check RLS/permissions in Supabase or add a row.
                  </div>
                ) : null}
              </div>
            </section>

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
                      {r.reservation_date} {r.reservation_time} • party {r.party_size}
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
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

