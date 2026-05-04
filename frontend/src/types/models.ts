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

export type AppPage = "dashboard" | "create";

export type CustomerMode = "existing" | "new";

/** Result of the last reservation submit (success shown on dashboard; error on create page). */
export type ReservationSubmitNotice =
  | null
  | { kind: "success"; message: string }
  | { kind: "error"; reason: string };
