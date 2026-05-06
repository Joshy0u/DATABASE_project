import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCustomer,
  createReservation,
  deleteReservation,
  updateReservation,
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
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editReservationId, setEditReservationId] = useState<number | null>(null);

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
      let finalCustomerId: number;
      if (customerMode === "new") {
        const createdCustomer = await createCustomer({
          first_name: newFirstName.trim(),
          last_name: newLastName.trim(),
          phone: newPhone.trim() || null,
          email: newEmail.trim() || null,
        });
        finalCustomerId = createdCustomer.item.customer_id;
      } else {
        finalCustomerId = Number(formCustomerId || firstCustomerId);
      }

      let message = "";
      if (formMode === "create") {
        const reservationResponse = await createReservation({
          reservation_date: formDate,
          reservation_time: `${formTime}:00`,
          party_size: formPartySize,
          status: formStatus,
          customer_id: finalCustomerId,
        });
        message = reservationResponse.message ?? "";
      } else if (formMode === "edit" && editReservationId) {
        const reservationResponse = await updateReservation(editReservationId, {
          reservation_date: formDate,
          reservation_time: `${formTime}:00`,
          party_size: formPartySize,
          status: formStatus,
          customer_id: finalCustomerId,
        });
        message = reservationResponse.message ?? "";
      }

      await refresh();
      setSubmitNotice({
        kind: "success",
        message,
      });
      setPage("dashboard");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "An unknown error occurred.";
      setSubmitNotice({ kind: "error", message });
      setLoading(false);
    }
  }, [
    customerMode,
    formMode,
    editReservationId,
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

  const deleteReservationById = useCallback(async (reservationId: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteReservation(reservationId);
      await refresh();
      setSubmitNotice({
        kind: "success",
        message: "Reservation removed successfully",
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "An unknown error occurred while deleting.";
      setSubmitNotice({ kind: "error", message });
      setLoading(false);
    }
  }, [refresh]);

  const updateReservationStatusById = useCallback(async (reservationId: number, status: string) => {
    setLoading(true);
    setError(null);
    try {
      await updateReservation(reservationId, { status });
      await refresh();
      setSubmitNotice({
        kind: "success",
        message: "Reservation status updated",
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "An unknown error occurred while updating status.";
      setSubmitNotice({ kind: "error", message });
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startEditReservation = useCallback(
    (reservation: Reservation) => {
      setFormMode("edit");
      setEditReservationId(reservation.reservation_id);
      setFormCustomerId(reservation.customer_id);
      setCustomerMode("existing");
      setFormDate(reservation.reservation_date || "");
      // Handle "HH:MM:SS" time formats if present
      setFormTime(reservation.reservation_time?.slice(0, 5) || "18:30");
      setFormPartySize(reservation.party_size || 2);
      setFormStatus(reservation.status || "booked");
      clearReservationSubmitNotice();
      setPage("create");
    },
    [clearReservationSubmitNotice]
  );

  const resetFormToCreate = useCallback(() => {
    setFormMode("create");
    setEditReservationId(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTime("18:30");
    setFormPartySize(2);
    setFormStatus("booked");
    setCustomerMode("existing");
    clearReservationSubmitNotice();
    setPage("create");
  }, [clearReservationSubmitNotice]);

  return {
    page,
    setPage,
    loading,
    error,
    customers,
    reservations,
    refresh,
    formMode,
    editReservationId,
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
    deleteReservationById,
    updateReservationStatusById,
    startEditReservation,
    resetFormToCreate,
    submitNotice,
    clearReservationSubmitNotice,
  };
}
