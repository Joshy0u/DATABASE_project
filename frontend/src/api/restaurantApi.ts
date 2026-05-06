import { apiGet, apiPost } from "../lib/api";
import type { Customer, FloorPlanArea, Reservation } from "../types/models";

export async function fetchCustomers(limit = 25) {
  return apiGet<{ items: Customer[] }>(`/api/customers?limit=${limit}`);
}

export async function fetchReservations(limit = 25) {
  return apiGet<{ items: Reservation[] }>(`/api/reservations?limit=${limit}`);
}

export async function createCustomer(payload: {
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
}) {
  return apiPost<{ item: Customer; message?: string }>("/api/customers", payload);
}

export async function createReservation(payload: {
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  customer_id: number;
}) {
  return apiPost<{ item: Reservation; message?: string }>(
    "/api/reservations",
    payload,
  );
}

export async function fetchFloorPlan() {
  return apiGet<{ areas: FloorPlanArea[] }>("/api/floorplan");
}

