from __future__ import annotations

import os
import random
import sqlite3
from datetime import date, timedelta
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "smart_energy.db"
DB_PATH = Path(os.getenv("SMART_ENERGY_DB_PATH", str(DEFAULT_DB_PATH))).resolve()

ROOM_APPLIANCES = {
    "bedroom": [
        {"name": "AC", "watts": 1500, "hours": 6.5, "variability": 0.20},
        {"name": "Ceiling Fan", "watts": 70, "hours": 9.0, "variability": 0.18},
        {"name": "Bedside Lamp", "watts": 18, "hours": 4.2, "variability": 0.15},
        {"name": "Laptop", "watts": 90, "hours": 5.3, "variability": 0.22},
    ],
    "kitchen": [
        {"name": "Refrigerator", "watts": 180, "hours": 11.5, "variability": 0.08},
        {"name": "Microwave", "watts": 1200, "hours": 0.55, "variability": 0.25},
        {"name": "Induction Cooktop", "watts": 1800, "hours": 1.1, "variability": 0.22},
        {"name": "Dishwasher", "watts": 1300, "hours": 0.75, "variability": 0.18},
    ],
    "living_room": [
        {"name": "Smart TV", "watts": 120, "hours": 4.8, "variability": 0.18},
        {"name": "Air Purifier", "watts": 45, "hours": 8.1, "variability": 0.10},
        {"name": "Ambient Lights", "watts": 60, "hours": 5.6, "variability": 0.12},
        {"name": "Gaming Console", "watts": 200, "hours": 1.8, "variability": 0.35},
    ],
    "bathroom": [
        {"name": "Water Heater", "watts": 2000, "hours": 0.8, "variability": 0.24},
        {"name": "Exhaust Fan", "watts": 45, "hours": 1.2, "variability": 0.14},
        {"name": "Vanity Lights", "watts": 40, "hours": 1.6, "variability": 0.16},
        {"name": "Washing Machine", "watts": 500, "hours": 0.65, "variability": 0.30},
    ],
}

ROOM_LABELS = {
    "bedroom": "Bedroom",
    "kitchen": "Kitchen",
    "living_room": "Living Room",
    "bathroom": "Bathroom",
}

HOUSEHOLDS = [
    {"name": "You", "efficiency": 1.00},
    {"name": "Solar Hive", "efficiency": 0.82},
    {"name": "River Residency", "efficiency": 0.94},
    {"name": "Eco Orbit", "efficiency": 0.88},
    {"name": "Metro Greens", "efficiency": 1.06},
]


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                household_name TEXT NOT NULL,
                room TEXT NOT NULL,
                appliance_name TEXT NOT NULL,
                watts REAL NOT NULL,
                hours_per_day REAL NOT NULL,
                usage_date TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'seed',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_logs_household_date ON logs(household_name, usage_date)"
        )

        row_count = connection.execute("SELECT COUNT(*) AS total FROM logs").fetchone()["total"]
        if row_count == 0:
            seed_sample_data(connection)


def infer_room_from_appliance(appliance_name: str) -> str:
    lowered = appliance_name.strip().lower()
    for room_name, appliances in ROOM_APPLIANCES.items():
        for appliance in appliances:
            if appliance["name"].lower() == lowered:
                return room_name
    return "living_room"


def seed_sample_data(connection: sqlite3.Connection) -> None:
    rng = random.Random(42)
    today = date.today()
    start_day = today - timedelta(days=179)
    rows: list[tuple[str, str, str, float, float, str, str]] = []

    for offset in range(180):
        usage_day = start_day + timedelta(days=offset)
        seasonal_factor = 1.12 if usage_day.month in {4, 5, 6, 7, 8} else 0.94
        weekend_factor = 1.08 if usage_day.weekday() >= 5 else 1.0

        for household in HOUSEHOLDS:
            household_factor = household["efficiency"]
            for room_name, appliances in ROOM_APPLIANCES.items():
                for appliance in appliances:
                    base_hours = appliance["hours"]
                    appliance_factor = seasonal_appliance_factor(appliance["name"], usage_day.month)
                    noise = max(
                        0.45,
                        rng.gauss(1.0, appliance["variability"]),
                    )
                    hours_used = round(
                        base_hours
                        * seasonal_factor
                        * weekend_factor
                        * household_factor
                        * appliance_factor
                        * noise,
                        2,
                    )
                    rows.append(
                        (
                            household["name"],
                            room_name,
                            appliance["name"],
                            float(appliance["watts"]),
                            max(hours_used, 0.15),
                            usage_day.isoformat(),
                            "seed",
                        )
                    )

    connection.executemany(
        """
        INSERT INTO logs (
            household_name,
            room,
            appliance_name,
            watts,
            hours_per_day,
            usage_date,
            source
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )
    connection.commit()


def seasonal_appliance_factor(appliance_name: str, month: int) -> float:
    if appliance_name == "AC":
        return 1.25 if month in {4, 5, 6, 7, 8, 9} else 0.55
    if appliance_name == "Water Heater":
        return 1.20 if month in {11, 12, 1, 2} else 0.85
    if appliance_name in {"Ambient Lights", "Bedside Lamp", "Vanity Lights"}:
        return 1.08 if month in {10, 11, 12, 1} else 0.96
    if appliance_name == "Washing Machine":
        return 1.12 if month in {6, 7, 8} else 1.0
    return 1.0
