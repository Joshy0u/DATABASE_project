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


@api_bp.get("/floorplan")
def floorplan():
    """Return every dining table grouped by DiningArea with live status info.

    Status logic:
        - "seated"   : a Visit exists with arrival_time set and departure_time IS NULL
        - "reserved" : a ReservationTable entry links to a Reservation dated today-or-later
                       that is NOT yet seated
        - "empty"    : neither seated nor reserved
    """
    from collections import defaultdict
    from datetime import date as _date, time as _time

    try:
        tbl_table = Table("Table", db.metadata, autoload_with=db.engine)
        tbl_area = Table("diningarea", db.metadata, autoload_with=db.engine)
        tbl_visit = Table("visit", db.metadata, autoload_with=db.engine)
        tbl_res = Table("reservation", db.metadata, autoload_with=db.engine)
        tbl_rt = Table("reservationtable", db.metadata, autoload_with=db.engine)
        tbl_sa = Table("staffassignment", db.metadata, autoload_with=db.engine)
        tbl_staff = Table("staff", db.metadata, autoload_with=db.engine)
        tbl_cust = Table("customer", db.metadata, autoload_with=db.engine)
    except Exception as e:
        return jsonify({"error": f"Schema reflection failed: {e}"}), 500

    # --- Fetch all areas --------------------------------------------------
    areas_rows = db.session.execute(select(tbl_area)).mappings().all()
    areas_map: dict[int, dict] = {
        r["dining_area_id"]: {"area_id": r["dining_area_id"], "area_name": r["area_name"], "tables": []}
        for r in areas_rows
    }

    # --- Fetch all tables -------------------------------------------------
    tables_rows = db.session.execute(select(tbl_table)).mappings().all()

    # --- Current visits (arrival_time set, departure_time NULL) ------------
    active_visits_q = (
        select(
            tbl_visit.c.visit_id,
            tbl_visit.c.arrival_time,
            tbl_visit.c.reservation_id,
        )
        .where(tbl_visit.c.arrival_time.isnot(None))
        .where(tbl_visit.c.departure_time.is_(None))
    )
    active_visits = db.session.execute(active_visits_q).mappings().all()

    # Map reservation_id → visit row for active visits
    visit_by_res: dict[int, dict] = {}
    visit_by_id: dict[int, dict] = {}
    for v in active_visits:
        vd = dict(v)
        if vd["reservation_id"] is not None:
            visit_by_res[vd["reservation_id"]] = vd
        visit_by_id[vd["visit_id"]] = vd

    # --- ReservationTable mapping (table_id → list of reservation_ids) ----
    rt_rows = db.session.execute(select(tbl_rt)).mappings().all()
    rt_by_table: dict[int, list[int]] = defaultdict(list)
    rt_by_res: dict[int, int] = {}  # reservation_id → table_id
    for rt in rt_rows:
        rt_by_table[rt["table_id"]].append(rt["reservation_id"])
        rt_by_res[rt["reservation_id"]] = rt["table_id"]

    # --- Reservations (today or future, non-cancelled) --------------------
    today = _date.today()
    upcoming_res_q = (
        select(tbl_res)
        .where(tbl_res.c.reservation_date >= today)
    )
    upcoming_res = db.session.execute(upcoming_res_q).mappings().all()
    res_by_id: dict[int, dict] = {r["reservation_id"]: dict(r) for r in upcoming_res}

    # --- Staff assignments (visit_id → staff info) ------------------------
    sa_rows = db.session.execute(
        select(
            tbl_sa.c.visit_id,
            tbl_staff.c.first_name,
            tbl_staff.c.last_name,
            tbl_staff.c.role,
        ).join(tbl_staff, tbl_sa.c.staff_id == tbl_staff.c.staff_id)
    ).mappings().all()
    staff_by_visit: dict[int, dict] = {}
    for s in sa_rows:
        staff_by_visit[s["visit_id"]] = {
            "staff_name": f"{s['first_name']} {s['last_name']}".strip(),
            "staff_role": s["role"],
        }

    # --- Customers by ID --------------------------------------------------
    cust_rows = db.session.execute(select(tbl_cust)).mappings().all()
    cust_by_id: dict[int, str] = {
        c["customer_id"]: f"{c['first_name']} {c['last_name']}".strip()
        for c in cust_rows
    }

    # --- Build per-table payload ------------------------------------------
    for trow in tables_rows:
        t = dict(trow)
        table_id = t["table_id"]
        area_id = t["dining_area_id"]

        entry: dict[str, Any] = {
            "table_id": table_id,
            "table_number": t["table_number"],
            "capacity": t["capacity"],
            "status": "empty",
            "visit": None,
            "reservation": None,
        }

        # Check if table is currently seated via any of its reservation links
        seated = False
        for res_id in rt_by_table.get(table_id, []):
            if res_id in visit_by_res:
                v = visit_by_res[res_id]
                res_data = res_by_id.get(res_id, {})
                customer_id = res_data.get("customer_id")
                staff_info = staff_by_visit.get(v["visit_id"], {})
                entry["status"] = "seated"
                entry["visit"] = {
                    "customer_name": cust_by_id.get(customer_id, "Unknown") if customer_id else "Walk-in",
                    "party_size": res_data.get("party_size", 0),
                    "arrival_time": _json_safe(v["arrival_time"]),
                    "staff_name": staff_info.get("staff_name", "Unassigned"),
                    "staff_role": staff_info.get("staff_role", ""),
                }
                seated = True
                break

        # If not seated, check for upcoming reservation
        if not seated:
            for res_id in rt_by_table.get(table_id, []):
                res_data = res_by_id.get(res_id)
                if res_data and res_data.get("status", "").lower() not in ("cancelled", "finished", "completed"):
                    customer_id = res_data.get("customer_id")
                    entry["status"] = "reserved"
                    entry["reservation"] = {
                        "reservation_id": res_id,
                        "customer_name": cust_by_id.get(customer_id, "Unknown") if customer_id else "Unknown",
                        "party_size": res_data.get("party_size", 0),
                        "reservation_date": _json_safe(res_data.get("reservation_date")),
                        "reservation_time": _json_safe(res_data.get("reservation_time")),
                    }
                    break

        if area_id in areas_map:
            areas_map[area_id]["tables"].append(entry)

    return jsonify({"areas": list(areas_map.values())})


@api_bp.post("/tables/<int:table_id>/assign")
def assign_table(table_id: int):
    body = request.get_json(silent=True) or {}
    reservation_id = body.get("reservation_id")
    if not reservation_id:
        return jsonify({"error": "reservation_id is required"}), 400

    try:
        tbl_rt = Table("reservationtable", db.metadata, autoload_with=db.engine)
        db.session.execute(
            tbl_rt.insert().values(reservation_id=reservation_id, table_id=table_id)
        )
        db.session.commit()
        return jsonify({"ok": True})
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Database constraint failed. Perhaps already assigned or table doesn't exist?"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@api_bp.delete("/tables/<int:table_id>/clear")
def clear_table(table_id: int):
    try:
        tbl_rt = Table("reservationtable", db.metadata, autoload_with=db.engine)
        db.session.execute(
            tbl_rt.delete().where(tbl_rt.c.table_id == table_id)
        )
        db.session.commit()
        return jsonify({"ok": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

