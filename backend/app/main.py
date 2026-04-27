from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from .database import init_db
from .services import (
    PRIMARY_HOUSEHOLD,
    build_dashboard_payload,
    generate_excel_report,
    import_bill_workbook,
    insert_log_entry,
)

LOCAL_FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
DEFAULT_GITHUB_PAGES_ORIGIN_REGEX = r"^https://[a-z0-9-]+\.github\.io$"


def get_allowed_origins() -> list[str]:
    raw = os.getenv("FRONTEND_ORIGINS", "")
    configured = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return list(dict.fromkeys([*LOCAL_FRONTEND_ORIGINS, *configured]))


def get_allowed_origin_regex() -> str | None:
    raw = os.getenv("FRONTEND_ORIGIN_REGEX", DEFAULT_GITHUB_PAGES_ORIGIN_REGEX).strip()
    return raw or None


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Smart Energy Consumption Tracker API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_origin_regex=get_allowed_origin_regex(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EnergyLogIn(BaseModel):
    room: str = Field(..., examples=["bedroom"])
    appliance_name: str = Field(..., min_length=2)
    watts: float = Field(..., gt=0)
    hours_per_day: float = Field(..., gt=0)
    usage_date: str = Field(..., examples=["2026-04-18"])
    household_name: str | None = Field(default=None, examples=["You"])


@app.get("/api/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/dashboard")
def get_dashboard(
    household_name: str = Query(default=PRIMARY_HOUSEHOLD, min_length=1),
) -> dict:
    return build_dashboard_payload(household_name)


@app.post("/api/logs")
def create_log(log_entry: EnergyLogIn) -> JSONResponse:
    insert_log_entry(log_entry.model_dump())
    return JSONResponse(
        {
            "message": "Energy log saved successfully.",
            "dashboard": build_dashboard_payload(log_entry.household_name or PRIMARY_HOUSEHOLD),
        }
    )


@app.post("/api/bills/upload")
async def upload_bill(file: UploadFile = File(...)) -> JSONResponse:
    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported.")

    try:
        contents = await file.read()
        import_result = import_bill_workbook(contents)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:  # pragma: no cover - defensive error surface
        raise HTTPException(status_code=500, detail="Failed to parse workbook.") from error

    return JSONResponse(
        {
            "message": f"Imported {import_result['imported_rows']} rows from workbook.",
            "import_result": import_result,
            "dashboard": build_dashboard_payload(),
        }
    )


@app.get("/api/export/report")
def export_report(
    household_name: str = Query(default=PRIMARY_HOUSEHOLD, min_length=1),
) -> StreamingResponse:
    report_bytes = generate_excel_report(household_name)
    headers = {
        "Content-Disposition": 'attachment; filename="smart-energy-report.xlsx"',
    }
    return StreamingResponse(
        iter([report_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )
