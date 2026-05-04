"""User-facing API copy (single place to edit reservation/customer messaging)."""

RESERVATION_SUCCESS = (
    "Reservation successful, you may return back to the home page."
)

CUSTOMER_SUCCESS = "Customer created successfully."


def reservation_error(detail: str) -> str:
    return f"Reservation unsuccessful: {detail}"


def customer_error(detail: str) -> str:
    return f"Customer could not be created: {detail}"
