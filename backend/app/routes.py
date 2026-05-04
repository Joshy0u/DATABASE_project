from __future__ import annotations

from datetime import date, datetime, time
from typing import Any

from flask import Blueprint, jsonify, request
from sqlalchemy import Table, func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.exc import OperationalError
from sqlalchemy.exc import NoSuchTableError

from . import db
from . import messages as msg

api_bp = Blueprint("api", __name__)


def _json_safe(value: Any) -> Any:
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    return value


def _serialize_row(row: dict[str, Any]) -> dict[str, Any]:
    return {k: _json_safe(v) for k, v in row.items()}


def _get_table(table_name: str) -> Table:
    try:
        return Table(table_name, db.metadata, autoload_with=db.engine)
    except NoSuchTableError as e:
        raise ValueError(f"Table not found: {table_name}") from e


@api_bp.get("/health")
def health():
    return jsonify({"ok": True})


@api_bp.get("/tables")
def list_tables():
    # Lists tables visible to the connection's current schema/search_path.
    inspector = db.inspect(db.engine)
    return jsonify(
        {
            "schema": "public",
            "tables": inspector.get_table_names(schema="public"),
        }
    )


@api_bp.get("/db-check")
def db_check():
    """Connectivity + row-count check against known tables."""
    try:
        db.session.execute(text("select 1"))
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names(schema="public")
    except OperationalError as e:
        return jsonify({"ok": False, "error": str(e)}), 500

    counts: dict[str, int | str] = {}
    for table_name in ("customer", "reservation", "waitlistentry", "visit"):
        if table_name not in tables:
            counts[table_name] = "not found"
            continue
        table = _get_table(table_name)
        count_value = db.session.execute(
            select(func.count()).select_from(table)
        ).scalar_one()
        counts[table_name] = int(count_value)

    return jsonify(
        {
            "ok": True,
            "tables_visible": tables,
            "row_counts": counts,
        }
    )


@api_bp.get("/customers")
def list_customers():
    customers = _get_table("customer")
    limit = min(int(request.args.get("limit", 50)), 200)

    rows = db.session.execute(select(customers).limit(limit)).mappings().all()
    return jsonify({"items": [_serialize_row(dict(r)) for r in rows]})


@api_bp.post("/customers")
def create_customer():
    customers = _get_table("customer")
    body: dict[str, Any] = request.get_json(silent=True) or {}

    allowed = {"first_name", "last_name", "phone", "email"}
    payload = {k: v for k, v in body.items() if k in allowed}

    if not payload.get("first_name") or not payload.get("last_name"):
        return jsonify(
            {"error": msg.customer_error("first_name and last_name are required.")}
        ), 400

    try:
        result = db.session.execute(
            customers.insert().values(**payload).returning(customers)
        )
        db.session.commit()
        created = result.mappings().first()
        item = _serialize_row(dict(created)) if created else payload
        return jsonify({"item": item, "message": msg.CUSTOMER_SUCCESS}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify(
            {"error": msg.customer_error("duplicate or invalid data (database constraint).")}
        ), 400
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": msg.customer_error(str(exc))}), 500


@api_bp.get("/reservations")
def list_reservations():
    reservation = _get_table("reservation")
    limit = min(int(request.args.get("limit", 50)), 200)

    rows = (
        db.session.execute(select(reservation).limit(limit)).mappings().all()
    )
    return jsonify({"items": [_serialize_row(dict(r)) for r in rows]})


@api_bp.post("/reservations")
def create_reservation():
    reservation = _get_table("reservation")
    body: dict[str, Any] = request.get_json(silent=True) or {}

    allowed = {
        "reservation_date",
        "reservation_time",
        "party_size",
        "status",
        "customer_id",
    }
    payload = {k: v for k, v in body.items() if k in allowed}

    if "customer_id" not in payload:
        return jsonify(
            {"error": msg.reservation_error("customer_id is required.")}
        ), 400

    try:
        result = db.session.execute(
            reservation.insert().values(**payload).returning(reservation)
        )
        db.session.commit()
        created = result.mappings().first()
        item = _serialize_row(dict(created)) if created else payload
        return jsonify({"item": item, "message": msg.RESERVATION_SUCCESS}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify(
            {
                "error": msg.reservation_error(
                    "invalid or duplicate data (database constraint)."
                )
            }
        ), 400
    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": msg.reservation_error(str(exc))}), 500

