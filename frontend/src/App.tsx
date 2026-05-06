import { motion } from "framer-motion";
import { AppHeader } from "./components/layout/AppHeader";
import { ErrorAlert } from "./components/ErrorAlert";
import { DashboardView } from "./components/dashboard/DashboardView";
import { ReservationSuccessBanner } from "./components/dashboard/ReservationSuccessBanner";
import { CreateReservationView } from "./components/reservations/CreateReservationView";
import { FloorPlan } from "./components/dashboard/FloorPlan";
import { useReservationDashboard } from "./hooks/useReservationDashboard";

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
        onGoFloorPlan={() => h.setPage("floorplan")}
      />

      <main className="mx-auto max-w-5xl px-4 py-10">
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
          ) : h.page === "floorplan" ? (
            <FloorPlan />
          ) : (
            <DashboardView
              customers={h.customers}
              reservations={h.reservations}
              loading={h.loading}
            />
          )}
        </motion.div>
      </main>
    </div>
  );
}
