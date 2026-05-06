"""Pydantic models for API request/response validation and serialization."""

from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class Customer(BaseModel):
    """Customer record."""

    model_config = ConfigDict(from_attributes=True)

    customer_id: int
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[str] = None


class CustomerCreate(BaseModel):
    """Request body for creating a customer."""

    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[str] = None


class CustomerResponse(BaseModel):
    """Response wrapper for single customer."""

    item: Customer
    message: Optional[str] = None


class CustomersListResponse(BaseModel):
    """Response wrapper for multiple customers."""

    items: list[Customer]


class Reservation(BaseModel):
    """Reservation record."""

    model_config = ConfigDict(from_attributes=True)

    reservation_id: Optional[int] = None
    reservation_date: str
    reservation_time: str
    party_size: int
    status: Optional[str] = None
    customer_id: int


class ReservationCreate(BaseModel):
    """Request body for creating a reservation."""

    reservation_date: str
    reservation_time: str
    party_size: int
    status: str
    customer_id: int


class ReservationResponse(BaseModel):
    """Response wrapper for single reservation."""

    item: Reservation
    message: Optional[str] = None


class ReservationsListResponse(BaseModel):
    """Response wrapper for multiple reservations."""

    items: list[Reservation]


class HealthResponse(BaseModel):
    """Response for health check."""

    ok: bool


class TableListResponse(BaseModel):
    """Response for table listing."""

    model_config = ConfigDict(populate_by_name=True)

    schema_name: str = Field(alias="schema")
    tables: list[str]


class DbCheckResponse(BaseModel):
    """Response for database connectivity check."""

    ok: bool
    tables_visible: list[str]
    row_counts: dict[str, int | str]


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str
