import type { Customer } from "../../types/models";

type CustomerListPanelProps = {
  customers: Customer[];
  loading: boolean;
};

export function CustomerListPanel({ customers, loading }: CustomerListPanelProps) {
  return (
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
  );
}
