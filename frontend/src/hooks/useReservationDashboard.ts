import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCustomer,
  createReservation,
  fetchCustomers,
  fetchReservations,
} from "../api/restaurantApi";
import type {
  AppPage,
  Customer,
  CustomerMode,
  Reservation,
  ReservationSubmitNotice,
} from "../types/models";

export function useReservationDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<AppPage>("dashboard");
  const [customerMode, setCustomerMode] = useState<CustomerMode>("existing");

  const firstCustomerId = useMemo(() => customers[0]?.customer_id, [customers]);
  const [formCustomerId, setFormCustomerId] = useState<number | "">("");
  const [formDate, setFormDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [formTime, setFormTime] = useState("18:30");
  const [formPartySize, setFormPartySize] = useState(2);
  const [formStatus, setFormStatus] = useState("booked");

  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [submitNotice, setSubmitNotice] =
    useState<ReservationSubmitNotice>(null);

  const clearReservationSubmitNotice = useCallback(() => {
    setSubmitNotice(null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, r] = await Promise.all([
        fetchCustomers(25),
        fetchReservations(25),
      ]);
      setCustomers(c.items);
      setReservations(r.items);
      setFormCustomerId((prev) => {
        if (prev === "" && c.items.length > 0) return c.items[0].customer_id;
        return prev;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const createReservationFromForm = useCallback(async () => {
    setSubmitNotice(null);
    setLoading(true);
    setError(null);
    try {
      let customerId: number | undefined =
        customerMode === "existing"
          ? Number(formCustomerId || firstCustomerId)
          : undefined;

      if (customerMode === "new") {
        if (!newFirstName.trim() || !newLastName.trim()) {
          throw new Error("New customer requires first and last name.");
        }
        const createdCustomer = await createCustomer({
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

      await createReservation({
        reservation_date: formDate,
        reservation_time: `${formTime}:00`,
        party_size: formPartySize,
        status: formStatus,
        customer_id: customerId,
      });
      await refresh();
      setSubmitNotice({
        kind: "success",
        message:
          "Reservation successful, you may return back to the home page",
      });
      setPage("dashboard");
    } catch (e) {
      const reason =
        e instanceof Error ? e.message : "An unknown error occurred.";
      setSubmitNotice({ kind: "error", reason });
      setLoading(false);
    }
  }, [
    customerMode,
    formCustomerId,
    firstCustomerId,
    newFirstName,
    newLastName,
    newPhone,
    newEmail,
    formDate,
    formTime,
    formPartySize,
    formStatus,
    refresh,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    page,
    setPage,
    loading,
    error,
    customers,
    reservations,
    refresh,
    customerMode,
    setCustomerMode,
    formCustomerId,
    setFormCustomerId,
    formDate,
    setFormDate,
    formTime,
    setFormTime,
    formPartySize,
    setFormPartySize,
    formStatus,
    setFormStatus,
    newFirstName,
    setNewFirstName,
    newLastName,
    setNewLastName,
    newPhone,
    setNewPhone,
    newEmail,
    setNewEmail,
    createReservationFromForm,
    submitNotice,
    clearReservationSubmitNotice,
  };
}
