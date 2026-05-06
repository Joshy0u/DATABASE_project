import { Button } from "../ui/button";
import type { Customer, CustomerMode } from "../../types/models";

const field =
  "rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100";

type CreateReservationViewProps = {
  loading: boolean;
  formMode: "create" | "edit";
  customers: Customer[];
  customerMode: CustomerMode;
  onCustomerModeChange: (mode: CustomerMode) => void;
  formCustomerId: number | "";
  onFormCustomerIdChange: (id: number | "") => void;
  formDate: string;
  onFormDateChange: (v: string) => void;
  formTime: string;
  onFormTimeChange: (v: string) => void;
  formPartySize: number;
  onFormPartySizeChange: (v: number) => void;
  formStatus: string;
  onFormStatusChange: (v: string) => void;
  newFirstName: string;
  onNewFirstNameChange: (v: string) => void;
  newLastName: string;
  onNewLastNameChange: (v: string) => void;
  newPhone: string;
  onNewPhoneChange: (v: string) => void;
  newEmail: string;
  onNewEmailChange: (v: string) => void;
  onSubmit: () => void;
};

export function CreateReservationView({
  loading,
  formMode,
  customers,
  customerMode,
  onCustomerModeChange,
  formCustomerId,
  onFormCustomerIdChange,
  formDate,
  onFormDateChange,
  formTime,
  onFormTimeChange,
  formPartySize,
  onFormPartySizeChange,
  formStatus,
  onFormStatusChange,
  newFirstName,
  onNewFirstNameChange,
  newLastName,
  onNewLastNameChange,
  newPhone,
  onNewPhoneChange,
  newEmail,
  onNewEmailChange,
  onSubmit,
  submitNotice = null,
}: CreateReservationViewProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
      {submitNotice?.kind === "error" ? (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {submitNotice.message}
        </div>
      ) : null}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">
          {formMode === "create" ? "Create reservation" : "Edit reservation"}
        </h2>
      </div>
      <div className="mb-3 flex gap-2">
        <Button
          variant={customerMode === "existing" ? "default" : "secondary"}
          onClick={() => onCustomerModeChange("existing")}
          disabled={loading}
        >
          Existing customer
        </Button>
        <Button
          variant={customerMode === "new" ? "default" : "secondary"}
          onClick={() => onCustomerModeChange("new")}
          disabled={loading}
        >
          New customer
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        {customerMode === "existing" ? (
          <select
            className={field}
            value={formCustomerId}
            onChange={(e) => {
              const value = e.target.value;
              onFormCustomerIdChange(value ? Number(value) : "");
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
            className={field}
            type="text"
            placeholder="First name"
            value={newFirstName}
            onChange={(e) => onNewFirstNameChange(e.target.value)}
          />
        )}
        {customerMode === "new" ? (
          <input
            className={field}
            type="text"
            placeholder="Last name"
            value={newLastName}
            onChange={(e) => onNewLastNameChange(e.target.value)}
          />
        ) : (
          <input
            className={`${field} text-zinc-500`}
            type="text"
            value="Using existing customer"
            disabled
          />
        )}
        <input
          className={field}
          type="date"
          value={formDate}
          onChange={(e) => onFormDateChange(e.target.value)}
        />
        <input
          className={field}
          type="time"
          value={formTime}
          onChange={(e) => onFormTimeChange(e.target.value)}
        />
        <input
          className={field}
          type="number"
          min={1}
          value={formPartySize}
          onChange={(e) => onFormPartySizeChange(Number(e.target.value))}
        />
        <select
          className={field}
          value={formStatus}
          onChange={(e) => onFormStatusChange(e.target.value)}
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
            className={field}
            type="text"
            placeholder="Phone (optional)"
            value={newPhone}
            onChange={(e) => onNewPhoneChange(e.target.value)}
          />
          <input
            className={field}
            type="email"
            placeholder="Email (optional)"
            value={newEmail}
            onChange={(e) => onNewEmailChange(e.target.value)}
          />
        </div>
      ) : null}
      <div className="mt-3">
        <Button onClick={onSubmit} disabled={loading}>
          {formMode === "create" ? "Submit Reservation" : "Update Reservation"}
        </Button>
      </div>
    </section>
  );
}
