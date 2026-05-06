import { CustomerListPanel } from "./CustomerListPanel";
import { ReservationListPanel } from "./ReservationListPanel";
import { TableGrid } from "./TableGrid";
import type { Customer, Reservation } from "../../types/models";

type DashboardViewProps = {
  customers: Customer[];
  reservations: Reservation[];
  loading: boolean;
};

export function DashboardView({
  customers,
  reservations,
  loading,
}: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <TableGrid customers={customers} reservations={reservations} loading={loading} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CustomerListPanel customers={customers} loading={loading} />
        <ReservationListPanel reservations={reservations} loading={loading} />
      </div>
    </div>
  );
}
