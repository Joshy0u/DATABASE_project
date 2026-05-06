# Full Stack Starter (React + Flask + Supabase Postgres)

This project includes:
- `frontend`: React (Vite), shadcn-style UI setup, Framer Motions
- `backend`: Flask REST API
- `database`: PostgreSQL via Supabase connection string

## Project structure

- `frontend/` React app
- `backend/` Flask API app

## 1) Backend setup (Flask + Postgres)

From the project root:

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
FLASK_ENV=development
DATABASE_URL=postgresql://postgres:<YOUR-PASSWORD>@db.vibnlivcjaysffmvafnq.supabase.co:5432/postgres
```

Run backend:

```bash
python run.py
```

API runs on `http://localhost:5000`.

Available endpoints:
- `GET /api/health`
- `GET /api/tables`
- `GET /api/customers?limit=50`
- `GET /api/reservations?limit=50`
- `POST /api/reservations`

Example `POST /api/reservations` body:

```json
{
  "reservation_date": "2026-05-04",
  "reservation_time": "18:30:00",
  "party_size": 4,
  "status": "booked",
  "customer_id": 1
}
```

## 2) Frontend setup (React + shadcn-style + Framer Motion)

From project root:

Create `frontend/.env`:

```env
VITE_API_BASE=http://127.0.0.1:5000
```

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to Flask.

## Notes

- Do not commit your real database password.
- For production, tighten CORS and use a proper WSGI server (e.g. gunicorn).
