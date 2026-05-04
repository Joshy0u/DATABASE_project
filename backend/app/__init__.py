import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app() -> Flask:
    load_dotenv()

    app = Flask(__name__)

    try:
        import psycopg  # noqa: F401
    except Exception as exc:
        raise RuntimeError(
            "psycopg is not available. Reinstall with: pip install 'psycopg[binary]'"
        ) from exc

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set. Add it to backend/.env")

    # Ensure SQLAlchemy uses the psycopg driver explicitly.
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app)
    db.init_app(app)

    @app.get("/")
    def index():
        return {
            "message": "Flask API is running",
            "health": "/api/health",
            "db_check": "/api/db-check",
            "tables": "/api/tables",
            "customers": "/api/customers?limit=50",
            "reservations": "/api/reservations?limit=50",
        }

    from .routes import api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    return app
