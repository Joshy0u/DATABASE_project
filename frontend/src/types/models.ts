export type Customer = {
  customer_id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
};

export type Reservation = {
  reservation_id?: number;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string | null;
  customer_id: number;
};

export type AppPage = "dashboard" | "create" | "floorplan";

export type CustomerMode = "existing" | "new";

/** Result of the last reservation submit (success shown on dashboard; error on create page). */
export type ReservationSubmitNotice =
  | null
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

/* ── Floor Plan types ── */

export type TableVisitInfo = {
  customer_name: string;
  party_size: number;
  arrival_time: string;
  staff_name: string;
  staff_role: string;
};

export type TableReservationInfo = {
  reservation_id?: number;
  customer_name: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
};

export type FloorPlanTable = {
  table_id: number;
  table_number: number;
  capacity: number;
  status: "empty" | "seated" | "reserved";
  visit: TableVisitInfo | null;
  reservation: TableReservationInfo | null;
};

export type FloorPlanArea = {
  area_id: number;
  area_name: string;
  tables: FloorPlanTable[];
};

