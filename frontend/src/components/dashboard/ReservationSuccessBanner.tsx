type ReservationSuccessBannerProps = {
  message: string;
};

export function ReservationSuccessBanner({ message }: ReservationSuccessBannerProps) {
  return (
    <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 p-4 text-sm text-emerald-100">
      {message}
    </div>
  );
}
