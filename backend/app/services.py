from __future__ import annotations

import math
import re
from calendar import monthrange
from datetime import date, timedelta
from io import BytesIO
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression

from .database import ROOM_APPLIANCES, ROOM_LABELS, get_connection, infer_room_from_appliance

RATE_PER_KWH = 8.2
CO2_FACTOR = 0.82
CITY_AVERAGE_MONTHLY_KWH = 390.0
MONTHLY_BUDGET_INR = 3500.0
PRIMARY_HOUSEHOLD = "You"

MAP_POSITIONS = [
    {"zone": "North Grid", "x": 20, "y": 26},
    {"zone": "Riverfront", "x": 39, "y": 58},
    {"zone": "Central Loop", "x": 53, "y": 34},
    {"zone": "East Solar Bay", "x": 72, "y": 49},
    {"zone": "Green Ridge", "x": 84, "y": 22},
]


def fetch_logs_df(household_name: str | None = None) -> pd.DataFrame:
    query = "SELECT * FROM logs"
    params: list[Any] = []
    if household_name:
        query += " WHERE household_name = ?"
        params.append(household_name)

    with get_connection() as connection:
        dataframe = pd.read_sql_query(query, connection, params=params)

    if dataframe.empty:
        return pd.DataFrame(
            columns=[
                "id",
                "household_name",
                "room",
                "appliance_name",
                "watts",
                "hours_per_day",
                "usage_date",
                "source",
                "created_at",
                "kwh",
                "cost_inr",
            ]
        )

    dataframe["usage_date"] = pd.to_datetime(dataframe["usage_date"])
    dataframe["kwh"] = (dataframe["watts"] * dataframe["hours_per_day"]) / 1000.0
    dataframe["cost_inr"] = dataframe["kwh"] * RATE_PER_KWH
    return dataframe


def build_dashboard_payload(household_name: str = PRIMARY_HOUSEHOLD) -> dict[str, Any]:
    all_logs = fetch_logs_df()
    households = (
        sorted(all_logs["household_name"].dropna().astype(str).unique().tolist())
        if not all_logs.empty
        else [PRIMARY_HOUSEHOLD]
    )
    active_household = household_name if household_name in households else PRIMARY_HOUSEHOLD
    user_logs = all_logs[all_logs["household_name"] == active_household].copy()
    if user_logs.empty and not all_logs.empty:
        active_household = PRIMARY_HOUSEHOLD
        user_logs = all_logs[all_logs["household_name"] == active_household].copy()

    rooms = build_room_payload(user_logs)
    overview = build_overview(user_logs, rooms)
    weather = build_weather_overview(user_logs)
    compare = build_compare_payload(user_logs, all_logs, active_household)
    bill_breakdown = build_bill_breakdown(user_logs)
    challenges = build_challenges(user_logs, overview, bill_breakdown)
    goals = build_goals(user_logs, overview, bill_breakdown, challenges)
    analytics = build_analytics(user_logs, overview, rooms, compare)
    insights = build_insights(user_logs, overview, rooms, weather, compare, bill_breakdown)
    leaderboard = build_leaderboard(all_logs, active_household)
    pulse = build_pulse_payload(user_logs, rooms, overview, weather, bill_breakdown)
    planner = build_planner_payload(overview, weather)
    notifications = build_notifications(overview, analytics, goals, insights, pulse)
    eco_report = build_eco_report(overview, insights, goals, leaderboard, active_household)

    return {
        "generated_at": pd.Timestamp.now().isoformat(),
        "profile": {
            "active_household": active_household,
            "available_households": households,
            "city": "Bengaluru Metro Grid",
            "default_budget_inr": MONTHLY_BUDGET_INR,
        },
        "overview": overview,
        "pulse": pulse,
        "rooms": rooms,
        "analytics": analytics,
        "compare": compare,
        "goals": goals,
        "challenges": challenges,
        "bill_breakdown": bill_breakdown,
        "weather": weather,
        "planner": planner,
        "insights": insights,
        "leaderboard": leaderboard,
        "eco_report": eco_report,
        "notifications": notifications,
        "recent_logs": build_recent_logs(user_logs),
    }


def build_overview(user_logs: pd.DataFrame, rooms: list[dict[str, Any]]) -> dict[str, Any]:
    today = pd.Timestamp(date.today())
    month_start = today.replace(day=1)
    previous_month_start = month_start - pd.offsets.MonthBegin(1)
    week_start = today - pd.Timedelta(days=6)
    current_day = today.normalize()

    current_month = user_logs[user_logs["usage_date"] >= month_start]
    previous_month = user_logs[
        (user_logs["usage_date"] >= previous_month_start)
        & (user_logs["usage_date"] < month_start)
    ]
    current_week = user_logs[user_logs["usage_date"] >= week_start]
    current_day_logs = user_logs[user_logs["usage_date"] == current_day]

    month_kwh = round(float(current_month["kwh"].sum()), 2)
    month_cost = round(float(current_month["cost_inr"].sum()), 2)
    previous_month_kwh = float(previous_month["kwh"].sum())
    trend_pct = safe_pct_delta(month_kwh, previous_month_kwh)
    budget_used_pct = round((month_cost / MONTHLY_BUDGET_INR) * 100, 1) if MONTHLY_BUDGET_INR else 0.0
    carbon_kg = round(month_kwh * CO2_FACTOR, 2)
    budget_remaining = round(MONTHLY_BUDGET_INR - month_cost, 2)
    city_delta_pct = safe_pct_delta(month_kwh, CITY_AVERAGE_MONTHLY_KWH)

    top_appliance = (
        current_month.groupby("appliance_name")["kwh"].sum().sort_values(ascending=False).head(1)
    )
    peak_day = (
        current_week.groupby(current_week["usage_date"].dt.date)["kwh"]
        .sum()
        .sort_values(ascending=False)
        .head(1)
    )
    today_room_totals = current_day_logs.groupby("room")["kwh"].sum().sort_values(ascending=False)
    current_room_id = today_room_totals.index[0] if not today_room_totals.empty else (
        max(rooms, key=lambda room: room["monthly_kwh"])["id"] if rooms else "living_room"
    )
    room_lookup = {room["id"]: room for room in rooms}
    current_room = room_lookup.get(current_room_id, {"label": "Living Room", "level": "green"})

    month_days = monthrange(today.year, today.month)[1]
    daily_budget_kwh = (MONTHLY_BUDGET_INR / RATE_PER_KWH) / month_days if RATE_PER_KWH else 0.0
    daily_series = (
        user_logs.groupby(user_logs["usage_date"].dt.date)["kwh"]
        .sum()
        .sort_index(ascending=False)
        .head(31)
    )
    streak_days = 0
    for _, value in daily_series.items():
        if value <= daily_budget_kwh:
            streak_days += 1
        else:
            break

    hourly_profile = estimate_hourly_profile(current_month)
    peak_window = format_peak_window(hourly_profile)
    current_hour = pd.Timestamp.now().hour
    current_load_kw = round(hourly_profile[current_hour], 2) if hourly_profile else 0.0

    eco_score = round(
        max(
            28.0,
            min(96.0, 82.0 - city_delta_pct * 0.6 - max(0.0, budget_used_pct - 80.0) * 0.2),
        ),
        1,
    )

    return {
        "month_label": month_start.strftime("%B %Y"),
        "current_month_kwh": month_kwh,
        "monthly_cost_inr": month_cost,
        "carbon_kg": carbon_kg,
        "budget_inr": MONTHLY_BUDGET_INR,
        "budget_used_pct": min(budget_used_pct, 150.0),
        "budget_remaining_inr": budget_remaining,
        "city_average_kwh": CITY_AVERAGE_MONTHLY_KWH,
        "vs_city_pct": city_delta_pct,
        "month_over_month_pct": trend_pct,
        "eco_score": eco_score,
        "top_appliance": {
            "name": top_appliance.index[0] if not top_appliance.empty else "AC",
            "kwh": round(float(top_appliance.iloc[0]), 2) if not top_appliance.empty else 0.0,
        },
        "peak_day": {
            "date": peak_day.index[0].isoformat() if not peak_day.empty else today.date().isoformat(),
            "kwh": round(float(peak_day.iloc[0]), 2) if not peak_day.empty else 0.0,
        },
        "weekly_kwh": round(float(current_week["kwh"].sum()), 2),
        "today_kwh": round(float(current_day_logs["kwh"].sum()), 2),
        "today_cost_inr": round(float(current_day_logs["cost_inr"].sum()), 2),
        "current_load_kw": current_load_kw,
        "current_room_label": current_room["label"],
        "current_room_level": current_room["level"],
        "active_appliances": int(user_logs["appliance_name"].nunique()),
        "peak_window": peak_window,
        "daily_budget_kwh": round(daily_budget_kwh, 2),
        "budget_safe_streak_days": streak_days,
    }


def build_room_payload(user_logs: pd.DataFrame) -> list[dict[str, Any]]:
    today = pd.Timestamp(date.today())
    week_start = today - pd.Timedelta(days=6)
    month_start = today.replace(day=1)
    current_week = user_logs[user_logs["usage_date"] >= week_start]
    current_month = user_logs[user_logs["usage_date"] >= month_start]

    weekly_totals = current_week.groupby("room")["kwh"].sum()
    max_room_value = max(float(weekly_totals.max()), 1.0) if not weekly_totals.empty else 1.0

    room_positions = {
        "bedroom": [-1.6, 0.55, -1.2],
        "kitchen": [-1.6, 0.55, 1.2],
        "living_room": [1.6, 0.55, -1.2],
        "bathroom": [1.6, 0.55, 1.2],
    }

    rooms: list[dict[str, Any]] = []
    for room_name in ROOM_APPLIANCES:
        room_month = current_month[current_month["room"] == room_name]
        room_week_value = float(weekly_totals.get(room_name, 0.0))
        normalized = room_week_value / max_room_value if max_room_value else 0.0
        level = level_from_ratio(normalized)
        color = color_from_level(level)
        appliance_breakdown = (
            room_month.groupby(["appliance_name", "watts"])
            .agg(
                kwh=("kwh", "sum"),
                cost_inr=("cost_inr", "sum"),
                hours_per_day=("hours_per_day", "mean"),
            )
            .reset_index()
            .sort_values("kwh", ascending=False)
        )

        room_total = max(float(room_month["kwh"].sum()), 1e-6)
        appliance_payload = [
            {
                "name": row["appliance_name"],
                "watts": round(float(row["watts"]), 1),
                "hours_per_day": round(float(row["hours_per_day"]), 2),
                "kwh": round(float(row["kwh"]), 2),
                "cost_inr": round(float(row["cost_inr"]), 2),
                "share": round((float(row["kwh"]) / room_total) * 100, 1),
            }
            for _, row in appliance_breakdown.iterrows()
        ]
        primary_appliance = appliance_payload[0]["name"] if appliance_payload else "Standby Load"

        rooms.append(
            {
                "id": room_name,
                "label": ROOM_LABELS[room_name],
                "weekly_kwh": round(room_week_value, 2),
                "monthly_kwh": round(float(room_month["kwh"].sum()), 2),
                "level": level,
                "color": color,
                "brightness": round(0.35 + normalized * 0.65, 2),
                "position": room_positions[room_name],
                "primary_appliance": primary_appliance,
                "appliances": appliance_payload,
            }
        )

    return rooms


def build_analytics(
    user_logs: pd.DataFrame,
    overview: dict[str, Any],
    rooms: list[dict[str, Any]],
    compare: dict[str, Any],
) -> dict[str, Any]:
    today = pd.Timestamp(date.today())
    week_start = today - pd.Timedelta(days=6)
    month_start = today.replace(day=1)
    heatmap_start = today - pd.Timedelta(days=83)
    trend_start = today - pd.Timedelta(days=29)

    current_week = user_logs[user_logs["usage_date"] >= week_start]
    current_month = user_logs[user_logs["usage_date"] >= month_start]
    trend_source = user_logs[user_logs["usage_date"] >= trend_start]
    heatmap_source = user_logs[user_logs["usage_date"] >= heatmap_start]

    weekly = current_week.groupby("appliance_name")["kwh"].sum()
    monthly = current_month.groupby("appliance_name")["kwh"].sum()
    appliance_names = sorted(set(weekly.index.tolist()) | set(monthly.index.tolist()))

    bar_chart = [
        {
            "appliance": appliance,
            "weekly": round(float(weekly.get(appliance, 0.0)), 2),
            "monthly": round(float(monthly.get(appliance, 0.0)), 2),
        }
        for appliance in appliance_names
    ]
    bar_chart.sort(key=lambda item: item["monthly"], reverse=True)

    trend_range = pd.date_range(trend_start, today, freq="D")
    trend_series = (
        trend_source.groupby(trend_source["usage_date"].dt.date)["kwh"]
        .sum()
        .reindex(trend_range.date, fill_value=0.0)
    )
    daily_trend = [
        {"date": trend_date.isoformat(), "kwh": round(float(value), 2)}
        for trend_date, value in trend_series.items()
    ]

    heatmap_range = pd.date_range(heatmap_start, today, freq="D")
    heatmap_series = (
        heatmap_source.groupby(heatmap_source["usage_date"].dt.date)["kwh"]
        .sum()
        .reindex(heatmap_range.date, fill_value=0.0)
    )
    max_heat = max(float(heatmap_series.max()), 1.0)
    heatmap = [
        {
            "date": heat_day.isoformat(),
            "kwh": round(float(value), 2),
            "intensity": round(float(value) / max_heat, 3),
        }
        for heat_day, value in heatmap_series.items()
    ]

    hourly_profile = estimate_hourly_profile(current_month)
    hourly_usage = [
        {"hour": hour, "kwh": round(value, 2)}
        for hour, value in enumerate(hourly_profile)
    ]

    alerts: list[dict[str, str]] = []
    if overview["budget_used_pct"] >= 100:
        alerts.append(
            {
                "level": "critical",
                "title": "Budget exceeded",
                "message": "Your projected spend has crossed the monthly target. Focus on AC and water heater runtime first.",
            }
        )
    elif overview["budget_used_pct"] >= 85:
        alerts.append(
            {
                "level": "warning",
                "title": "Budget nearing threshold",
                "message": "You have used most of this month's energy budget. Small cutbacks this week can keep the bill on track.",
            }
        )

    heavy_rooms = [room for room in rooms if room["level"] == "red"]
    if heavy_rooms:
        alerts.append(
            {
                "level": "warning",
                "title": "High-load rooms detected",
                "message": f"{', '.join(room['label'] for room in heavy_rooms)} is pulling above the normal range this week.",
            }
        )

    if compare["weekly"]["delta_pct"] > 8:
        alerts.append(
            {
                "level": "warning",
                "title": "Weekly load is climbing",
                "message": f"This week is {compare['weekly']['delta_pct']}% higher than the previous one.",
            }
        )

    if not alerts:
        alerts.append(
            {
                "level": "good",
                "title": "Energy profile looks balanced",
                "message": "Your usage is within the target band, with no severe room-level spikes detected.",
            }
        )

    return {
        "bar_chart": bar_chart[:8],
        "daily_trend": daily_trend,
        "heatmap": heatmap,
        "hourly_usage": hourly_usage,
        "alerts": alerts,
        "budget_status": {
            "used_pct": overview["budget_used_pct"],
            "remaining_inr": overview["budget_remaining_inr"],
        },
    }


def build_compare_payload(
    user_logs: pd.DataFrame,
    all_logs: pd.DataFrame,
    household_name: str,
) -> dict[str, Any]:
    today = pd.Timestamp(date.today())
    week_start = today - pd.Timedelta(days=6)
    previous_week_start = week_start - pd.Timedelta(days=7)
    previous_week_end = week_start - pd.Timedelta(days=1)
    month_start = today.replace(day=1)
    previous_month_start = month_start - pd.offsets.MonthBegin(1)

    current_week = user_logs[user_logs["usage_date"] >= week_start]
    previous_week = user_logs[
        (user_logs["usage_date"] >= previous_week_start)
        & (user_logs["usage_date"] <= previous_week_end)
    ]
    current_month = user_logs[user_logs["usage_date"] >= month_start]
    previous_month = user_logs[
        (user_logs["usage_date"] >= previous_month_start)
        & (user_logs["usage_date"] < month_start)
    ]

    current_week_kwh = float(current_week["kwh"].sum())
    previous_week_kwh = float(previous_week["kwh"].sum())
    current_month_kwh = float(current_month["kwh"].sum())
    previous_month_kwh = float(previous_month["kwh"].sum())

    monthly_current = current_month.groupby("appliance_name")["kwh"].sum()
    monthly_previous = previous_month.groupby("appliance_name")["kwh"].sum()
    appliance_names = sorted(set(monthly_current.index.tolist()) | set(monthly_previous.index.tolist()))
    top_changes = []
    for appliance in appliance_names:
        current_value = float(monthly_current.get(appliance, 0.0))
        previous_value = float(monthly_previous.get(appliance, 0.0))
        delta = current_value - previous_value
        top_changes.append(
            {
                "appliance": appliance,
                "current_kwh": round(current_value, 2),
                "delta_kwh": round(delta, 2),
                "delta_pct": safe_pct_delta(current_value, previous_value),
            }
        )
    top_changes.sort(key=lambda item: abs(item["delta_kwh"]), reverse=True)

    all_current_month = all_logs[all_logs["usage_date"] >= month_start]
    grouped = (
        all_current_month.groupby("household_name")["kwh"].sum().sort_values()
        if not all_current_month.empty
        else pd.Series(dtype=float)
    )
    user_value = float(grouped.get(household_name, current_month_kwh))
    similar_candidates = []
    for other_name, other_kwh in grouped.items():
        if other_name == household_name:
            continue
        similar_candidates.append(
            {
                "name": other_name,
                "current_month_kwh": round(float(other_kwh), 2),
                "delta_kwh": round(float(other_kwh) - user_value, 2),
            }
        )
    similar_candidates.sort(key=lambda item: abs(item["delta_kwh"]))

    return {
        "weekly": {
            "current_kwh": round(current_week_kwh, 2),
            "previous_kwh": round(previous_week_kwh, 2),
            "delta_pct": safe_pct_delta(current_week_kwh, previous_week_kwh),
        },
        "monthly": {
            "current_kwh": round(current_month_kwh, 2),
            "previous_kwh": round(previous_month_kwh, 2),
            "delta_pct": safe_pct_delta(current_month_kwh, previous_month_kwh),
        },
        "top_changes": top_changes[:4],
        "similar_homes": similar_candidates[:3],
    }


def build_goals(
    user_logs: pd.DataFrame,
    overview: dict[str, Any],
    bill_breakdown: dict[str, Any],
    challenges: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    today = pd.Timestamp(date.today())
    month_start = today.replace(day=1)
    previous_month_start = month_start - pd.offsets.MonthBegin(1)
    current_month = user_logs[user_logs["usage_date"] >= month_start]
    previous_month = user_logs[
        (user_logs["usage_date"] >= previous_month_start)
        & (user_logs["usage_date"] < month_start)
    ]

    top_appliance_name = overview["top_appliance"]["name"]
    current_top_kwh = float(
        current_month[current_month["appliance_name"] == top_appliance_name]["kwh"].sum()
    )
    previous_top_kwh = float(
        previous_month[previous_month["appliance_name"] == top_appliance_name]["kwh"].sum()
    )
    target_top_kwh = previous_top_kwh * 0.9 if previous_top_kwh else max(current_top_kwh * 0.9, 1.0)
    top_goal_progress = min(100.0, (target_top_kwh / max(current_top_kwh, target_top_kwh, 1e-6)) * 100)

    standby_cost = float(bill_breakdown["standby_cost_inr"])
    standby_target = max(float(bill_breakdown["monthly_cost_inr"]) * 0.12, 1.0)
    standby_progress = min(100.0, (standby_target / max(standby_cost, standby_target, 1e-6)) * 100)

    challenge_progress = round(
        sum(float(challenge["progress_pct"]) for challenge in challenges) / max(len(challenges), 1),
        1,
    )

    goals = [
        {
            "title": "Stay under your monthly budget",
            "target": f"Keep spend under Rs {int(MONTHLY_BUDGET_INR)}",
            "progress_pct": round(min(overview["budget_used_pct"], 100.0), 1),
            "status": "on_track" if overview["budget_used_pct"] < 100 else "off_track",
            "reward": "Budget Guardian",
        },
        {
            "title": f"Trim {top_appliance_name} usage by 10%",
            "target": f"Target {target_top_kwh:.1f} kWh this month",
            "progress_pct": round(top_goal_progress, 1),
            "status": "on_track" if top_goal_progress >= 80 else "watch",
            "reward": "Appliance Whisperer",
        },
        {
            "title": "Beat the city average",
            "target": f"Stay below {CITY_AVERAGE_MONTHLY_KWH:.0f} kWh",
            "progress_pct": round(min((CITY_AVERAGE_MONTHLY_KWH / max(overview['current_month_kwh'], 1e-6)) * 100, 100), 1),
            "status": "on_track" if overview["current_month_kwh"] <= CITY_AVERAGE_MONTHLY_KWH else "watch",
            "reward": "City Saver",
        },
        {
            "title": "Cut standby waste",
            "target": "Keep always-on devices under 12% of the bill",
            "progress_pct": round(standby_progress, 1),
            "status": "on_track" if standby_progress >= 80 else "watch",
            "reward": "Phantom Load Hunter",
        },
        {
            "title": "Finish this week's family challenge set",
            "target": "Complete all 3 active missions",
            "progress_pct": challenge_progress,
            "status": "done" if challenge_progress >= 100 else "in_progress",
            "reward": "Family Efficiency Cup",
        },
    ]
    return goals


def build_challenges(
    user_logs: pd.DataFrame,
    overview: dict[str, Any],
    bill_breakdown: dict[str, Any],
) -> list[dict[str, Any]]:
    today = pd.Timestamp(date.today())
    month_start = today.replace(day=1)
    current_month = user_logs[user_logs["usage_date"] >= month_start]
    ac_hours = float(current_month[current_month["appliance_name"] == "AC"]["hours_per_day"].mean() or 0.0)
    washer_hours = float(
        current_month[current_month["appliance_name"] == "Washing Machine"]["hours_per_day"].mean() or 0.0
    )
    standby_share = (
        (float(bill_breakdown["standby_cost_inr"]) / max(float(bill_breakdown["monthly_cost_inr"]), 1e-6)) * 100
    )

    cooling_progress = min(100.0, (6.0 / max(ac_hours, 6.0, 1e-6)) * 100) if ac_hours else 100.0
    laundry_progress = min(100.0, (0.8 / max(washer_hours, 0.8, 1e-6)) * 100) if washer_hours else 100.0
    standby_progress = min(100.0, (14.0 / max(standby_share, 14.0, 1e-6)) * 100)

    return [
        {
            "title": "Cool Smarter",
            "description": "Bring AC runtime under 6 hours per day this week.",
            "progress_pct": round(cooling_progress, 1),
            "reward_points": 120,
        },
        {
            "title": "Laundry Batch Mode",
            "description": "Keep washing machine runtime under 0.8 hours per day.",
            "progress_pct": round(laundry_progress, 1),
            "reward_points": 80,
        },
        {
            "title": "No-Standby Sunday",
            "description": "Push always-on cost below 14% of monthly spend.",
            "progress_pct": round(standby_progress, 1),
            "reward_points": 140,
        },
    ]


def build_bill_breakdown(user_logs: pd.DataFrame) -> dict[str, Any]:
    today = pd.Timestamp(date.today())
    month_start = today.replace(day=1)
    breakdown_source = user_logs[user_logs["usage_date"] >= month_start]
    monthly_cost = float(breakdown_source["cost_inr"].sum())

    appliance_df = (
        breakdown_source.groupby("appliance_name")
        .agg(cost_inr=("cost_inr", "sum"), kwh=("kwh", "sum"), hours_per_day=("hours_per_day", "mean"))
        .reset_index()
        .sort_values("cost_inr", ascending=False)
    )
    room_df = (
        breakdown_source.groupby("room")
        .agg(cost_inr=("cost_inr", "sum"), kwh=("kwh", "sum"))
        .reset_index()
        .sort_values("cost_inr", ascending=False)
    )

    by_appliance = [
        {
            "name": row["appliance_name"],
            "cost_inr": round(float(row["cost_inr"]), 2),
            "kwh": round(float(row["kwh"]), 2),
            "hours_per_day": round(float(row["hours_per_day"]), 2),
            "share_pct": round((float(row["cost_inr"]) / max(monthly_cost, 1e-6)) * 100, 1),
        }
        for _, row in appliance_df.head(8).iterrows()
    ]
    by_room = [
        {
            "name": ROOM_LABELS.get(row["room"], str(row["room"]).replace("_", " ").title()),
            "cost_inr": round(float(row["cost_inr"]), 2),
            "kwh": round(float(row["kwh"]), 2),
            "share_pct": round((float(row["cost_inr"]) / max(monthly_cost, 1e-6)) * 100, 1),
        }
        for _, row in room_df.iterrows()
    ]

    day_start = today - pd.Timedelta(days=13)
    daily_cost_series = (
        user_logs[user_logs["usage_date"] >= day_start]
        .groupby(user_logs[user_logs["usage_date"] >= day_start]["usage_date"].dt.date)["cost_inr"]
        .sum()
        .sort_index()
    )
    by_day = [
        {"date": day.isoformat(), "cost_inr": round(float(value), 2)}
        for day, value in daily_cost_series.items()
    ]

    standby_names = {"Refrigerator", "Air Purifier", "Ambient Lights", "Ceiling Fan"}
    standby_cost = float(
        breakdown_source[breakdown_source["appliance_name"].isin(standby_names)]["cost_inr"].sum()
    )
    top_item = by_appliance[0] if by_appliance else {"name": "AC", "share_pct": 0.0}

    return {
        "monthly_cost_inr": round(monthly_cost, 2),
        "by_appliance": by_appliance,
        "by_room": by_room,
        "by_day": by_day,
        "standby_cost_inr": round(standby_cost, 2),
        "highlight": f"{top_item['name']} is driving {top_item['share_pct']}% of this month's bill.",
    }


def build_weather_overview(user_logs: pd.DataFrame) -> dict[str, Any]:
    today = date.today()
    start_day = today - timedelta(days=29)
    daily_kwh = (
        user_logs.groupby(user_logs["usage_date"].dt.date)["kwh"].sum()
        if not user_logs.empty
        else pd.Series(dtype=float)
    )

    series = []
    for offset in range(30):
        target_day = start_day + timedelta(days=offset)
        temp_c = round(synthetic_temperature(target_day), 1)
        condition = weather_condition(temp_c)
        series.append(
            {
                "date": target_day.isoformat(),
                "temp_c": temp_c,
                "condition": condition,
                "kwh": round(float(daily_kwh.get(target_day, 0.0)), 2),
            }
        )

    temp_values = np.array([item["temp_c"] for item in series], dtype=float)
    kwh_values = np.array([item["kwh"] for item in series], dtype=float)
    if len(series) > 1 and np.std(temp_values) > 0 and np.std(kwh_values) > 0:
        correlation = float(np.corrcoef(temp_values, kwh_values)[0, 1])
    else:
        correlation = 0.0

    hottest_day = max(series, key=lambda item: item["temp_c"]) if series else {
        "date": today.isoformat(),
        "temp_c": 0.0,
        "condition": "Clear",
        "kwh": 0.0,
    }
    current_temp = round(synthetic_temperature(today), 1)
    next_week = []
    for offset in range(1, 8):
        target_day = today + timedelta(days=offset)
        temp_c = round(synthetic_temperature(target_day), 1)
        next_week.append(
            {
                "date": target_day.isoformat(),
                "temp_c": temp_c,
                "condition": weather_condition(temp_c),
                "risk": upcoming_weather_risk(temp_c),
            }
        )

    if correlation >= 0.35:
        summary = "Hotter days are strongly lifting your cooling load."
    elif correlation <= -0.2:
        summary = "Your usage drops when temperatures rise, suggesting efficient cooling habits."
    else:
        summary = "Weather has a mild effect on your usage, with appliance habits doing most of the work."

    return {
        "current_temp_c": current_temp,
        "condition": weather_condition(current_temp),
        "correlation": round(correlation, 2),
        "summary": summary,
        "hottest_day": hottest_day,
        "series": series,
        "next_week": next_week,
    }


def build_planner_payload(overview: dict[str, Any], weather: dict[str, Any]) -> dict[str, Any]:
    next_week = weather["next_week"]
    best_days = sorted(next_week, key=lambda item: (item["risk"], item["temp_c"]))[:3]
    watch_days = [item for item in next_week if item["risk"] == "watch"][:3]

    return {
        "daily_budget_inr": round(MONTHLY_BUDGET_INR / monthrange(date.today().year, date.today().month)[1], 2),
        "recommended_days": best_days,
        "watch_days": watch_days,
        "planning_hint": f"Heavy appliance tasks are safest before {overview['peak_window']} or on cooler days.",
    }


def build_insights(
    user_logs: pd.DataFrame,
    overview: dict[str, Any],
    rooms: list[dict[str, Any]],
    weather: dict[str, Any],
    compare: dict[str, Any],
    bill_breakdown: dict[str, Any],
) -> dict[str, Any]:
    today = pd.Timestamp(date.today())
    month_start = today.replace(day=1)
    current_month = user_logs[user_logs["usage_date"] >= month_start]

    monthly = (
        user_logs.set_index("usage_date")
        .resample("MS")
        .agg(kwh=("kwh", "sum"), cost_inr=("cost_inr", "sum"))
        .reset_index()
    )
    if monthly.empty:
        predicted_kwh = 0.0
        predicted_bill = 0.0
        confidence = 0.5
        next_month_label = (today + pd.offsets.MonthBegin(1)).strftime("%B %Y")
    else:
        features = np.arange(len(monthly)).reshape(-1, 1)
        regression = LinearRegression()
        regression.fit(features, monthly["kwh"])
        predicted_kwh = max(float(regression.predict([[len(monthly)]])[0]), 0.0)
        predicted_bill = predicted_kwh * RATE_PER_KWH
        score = regression.score(features, monthly["kwh"]) if len(monthly) > 1 else 0.58
        confidence = round(float(np.clip(0.58 + max(score, 0.0) * 0.32, 0.58, 0.93)), 2)
        next_month_label = (monthly["usage_date"].max() + pd.offsets.MonthBegin(1)).strftime("%B %Y")

    daily = (
        user_logs.groupby(user_logs["usage_date"].dt.date)
        .agg(kwh=("kwh", "sum"))
        .reset_index()
        .rename(columns={"usage_date": "date"})
    )

    anomalies: list[dict[str, Any]] = []
    if len(daily) >= 18:
        anomaly_features = np.column_stack(
            [
                pd.to_datetime(daily["date"]).map(pd.Timestamp.toordinal),
                daily["kwh"].to_numpy(),
                pd.to_datetime(daily["date"]).dt.dayofweek.to_numpy(),
            ]
        )
        forest = IsolationForest(random_state=42, contamination=0.08)
        predictions = forest.fit_predict(anomaly_features)
        baseline = max(float(daily["kwh"].median()), 1e-6)
        detected = daily[predictions == -1].sort_values("kwh", ascending=False).head(4)
        anomalies = [
            {
                "date": pd.Timestamp(row["date"]).strftime("%d %b"),
                "kwh": round(float(row["kwh"]), 2),
                "deviation_pct": round(((float(row["kwh"]) - baseline) / baseline) * 100, 1),
                "reason": anomaly_reason(float(row["kwh"]), baseline),
            }
            for _, row in detected.iterrows()
        ]

    tips = build_smart_tips(current_month)
    room_tips = build_room_tips(rooms)
    schedule_suggestions = build_schedule_suggestions(bill_breakdown["by_appliance"], overview["peak_window"])
    what_changed = build_what_changed(compare)

    return {
        "prediction": {
            "month": next_month_label,
            "predicted_kwh": round(predicted_kwh, 2),
            "predicted_bill_inr": round(predicted_bill, 2),
            "confidence": confidence,
        },
        "anomalies": anomalies,
        "tips": tips,
        "room_tips": room_tips,
        "weather_story": {
            "headline": weather["summary"],
            "correlation": weather["correlation"],
            "hottest_day": weather["hottest_day"],
        },
        "what_changed": what_changed,
        "schedule_suggestions": schedule_suggestions,
        "peak_hours": {
            "window": overview["peak_window"],
            "current_load_kw": overview["current_load_kw"],
            "message": f"Your highest pressure window is around {overview['peak_window']}. Move flexible loads outside it when possible.",
        },
    }


def build_smart_tips(current_month: pd.DataFrame) -> list[dict[str, Any]]:
    appliance_summary = (
        current_month.groupby(["appliance_name", "watts"])
        .agg(kwh=("kwh", "sum"), hours_per_day=("hours_per_day", "mean"))
        .reset_index()
        .sort_values("kwh", ascending=False)
        .head(4)
    )

    tip_templates = {
        "AC": (
            "Turn off AC 1 hour earlier",
            lambda watts: round((watts / 1000.0) * 30 * RATE_PER_KWH, 0),
            "Shift cooling to a shorter evening window and let the fan carry the last hour.",
        ),
        "Water Heater": (
            "Trim water heater runtime by 20 minutes",
            lambda watts: round((watts / 1000.0) * (20 / 60) * 30 * RATE_PER_KWH, 0),
            "A shorter heat cycle keeps comfort high while cutting one of the heaviest daily loads.",
        ),
        "Induction Cooktop": (
            "Batch cooking once per day",
            lambda watts: round((watts / 1000.0) * 0.35 * 30 * RATE_PER_KWH, 0),
            "Cooking in one focused block reduces repeated preheat peaks.",
        ),
        "Smart TV": (
            "Use auto-sleep on the TV",
            lambda watts: round((watts / 1000.0) * 1.0 * 30 * RATE_PER_KWH, 0),
            "Late-night standby usage adds up faster than it feels.",
        ),
        "Refrigerator": (
            "Raise fridge setting by 1 degree C",
            lambda watts: round((watts / 1000.0) * 1.2 * 30 * RATE_PER_KWH * 0.18, 0),
            "A small temperature tweak can reduce compressor cycles without hurting food safety.",
        ),
    }

    tips: list[dict[str, Any]] = []
    for _, row in appliance_summary.iterrows():
        appliance_name = str(row["appliance_name"])
        watts = float(row["watts"])
        if appliance_name in tip_templates:
            title, savings_fn, description = tip_templates[appliance_name]
        else:
            title = f"Reduce {appliance_name} runtime by 30 minutes"
            savings_fn = lambda current_watts: round((current_watts / 1000.0) * 0.5 * 30 * RATE_PER_KWH, 0)
            description = "Small time reductions on repeat loads often produce the easiest monthly savings."

        impact_inr = max(float(savings_fn(watts)), 45.0)
        tips.append(
            {
                "title": title,
                "body": f"{description} Estimated saving: Rs {impact_inr:.0f}/month.",
                "impact_inr": round(impact_inr, 0),
            }
        )
        if len(tips) == 3:
            break

    if not tips:
        tips.append(
            {
                "title": "Your profile is already efficient",
                "body": "Stay within budget by shifting large appliances to shorter daily windows.",
                "impact_inr": 0.0,
            }
        )
    return tips


def build_room_tips(rooms: list[dict[str, Any]]) -> list[dict[str, Any]]:
    tips = []
    for room in sorted(rooms, key=lambda item: item["monthly_kwh"], reverse=True)[:3]:
        appliance = room["primary_appliance"]
        if room["level"] == "red":
            body = f"{room['label']} is running hot. Start by trimming {appliance} usage during the peak window."
        elif room["level"] == "yellow":
            body = f"{room['label']} is drifting upward. A lighter schedule for {appliance} should keep it in the green band."
        else:
            body = f"{room['label']} is efficient right now. Keep {appliance} on the current schedule."
        tips.append(
            {
                "room": room["label"],
                "title": f"{room['label']} recommendation",
                "body": body,
            }
        )
    return tips


def build_schedule_suggestions(
    appliance_breakdown: list[dict[str, Any]],
    peak_window: str,
) -> list[dict[str, Any]]:
    suggestions = []
    for item in appliance_breakdown[:3]:
        name = item["name"]
        if name in {"Dishwasher", "Washing Machine"}:
            action = f"Run {name.lower()} loads after the evening peak instead of during {peak_window}."
        elif name in {"Induction Cooktop", "Microwave"}:
            action = f"Batch cooking earlier in the day to avoid the {peak_window} spike."
        elif name == "Water Heater":
            action = "Heat water closer to shower time and shorten the warm-up cycle."
        else:
            action = f"Shift flexible {name.lower()} usage outside {peak_window} where possible."
        suggestions.append(
            {
                "title": f"Schedule {name} smarter",
                "body": action,
            }
        )
    return suggestions


def build_what_changed(compare: dict[str, Any]) -> list[dict[str, Any]]:
    changes = []
    if compare["weekly"]["delta_pct"] > 0:
        changes.append(
            {
                "title": "Weekly demand increased",
                "body": f"Your last 7 days were {compare['weekly']['delta_pct']}% higher than the previous week.",
            }
        )
    else:
        changes.append(
            {
                "title": "Weekly demand improved",
                "body": f"You used {-compare['weekly']['delta_pct']}% less energy than the previous week.",
            }
        )

    for item in compare["top_changes"][:2]:
        direction = "up" if item["delta_kwh"] >= 0 else "down"
        changes.append(
            {
                "title": f"{item['appliance']} moved {direction}",
                "body": f"{item['appliance']} changed by {abs(item['delta_kwh'])} kWh month over month.",
            }
        )
    return changes[:3]


def build_pulse_payload(
    user_logs: pd.DataFrame,
    rooms: list[dict[str, Any]],
    overview: dict[str, Any],
    weather: dict[str, Any],
    bill_breakdown: dict[str, Any],
) -> dict[str, Any]:
    current_room = max(rooms, key=lambda item: item["monthly_kwh"]) if rooms else {
        "label": "Living Room",
        "primary_appliance": "AC",
    }
    grid_status = "Stable" if overview["budget_used_pct"] < 80 else "Watch"
    narrative = (
        f"{current_room['label']} is leading the current demand, with {current_room['primary_appliance']} as the main load."
    )
    cost_pressure = bill_breakdown["by_appliance"][0] if bill_breakdown["by_appliance"] else {
        "name": "AC",
        "cost_inr": 0.0,
    }

    return {
        "current_load_kw": overview["current_load_kw"],
        "estimated_today_cost_inr": overview["today_cost_inr"],
        "today_kwh": overview["today_kwh"],
        "room_label": overview["current_room_label"],
        "peak_window": overview["peak_window"],
        "grid_status": grid_status,
        "temperature_c": weather["current_temp_c"],
        "condition": weather["condition"],
        "narrative": narrative,
        "cost_pressure": {
            "appliance": cost_pressure["name"],
            "cost_inr": cost_pressure["cost_inr"],
        },
    }


def build_leaderboard(all_logs: pd.DataFrame, active_household: str = PRIMARY_HOUSEHOLD) -> list[dict[str, Any]]:
    today = pd.Timestamp(date.today())
    month_start = today.replace(day=1)
    previous_month_start = month_start - pd.offsets.MonthBegin(1)

    current_month = all_logs[all_logs["usage_date"] >= month_start]
    previous_month = all_logs[
        (all_logs["usage_date"] >= previous_month_start)
        & (all_logs["usage_date"] < month_start)
    ]

    current_grouped = current_month.groupby("household_name")["kwh"].sum()
    previous_grouped = previous_month.groupby("household_name")["kwh"].sum()

    leaderboard: list[dict[str, Any]] = []
    for index, (household_name, current_kwh) in enumerate(current_grouped.sort_values().items()):
        previous_kwh = float(previous_grouped.get(household_name, current_kwh))
        saved_kwh = max(CITY_AVERAGE_MONTHLY_KWH - float(current_kwh), 0.0)
        reduction_pct = (
            ((previous_kwh - float(current_kwh)) / previous_kwh) * 100 if previous_kwh else 0.0
        )
        badges = []
        if saved_kwh >= 100:
            badges.append("Saved 100 kWh")
        if float(current_kwh) < CITY_AVERAGE_MONTHLY_KWH * 0.78:
            badges.append("Grid Guardian")
        if reduction_pct >= 5:
            badges.append("Trend Setter")
        if not badges:
            badges.append("Consistent Saver")

        marker = MAP_POSITIONS[index % len(MAP_POSITIONS)]
        leaderboard.append(
            {
                "name": household_name,
                "current_month_kwh": round(float(current_kwh), 2),
                "saved_kwh": round(saved_kwh, 2),
                "reduction_pct": round(reduction_pct, 1),
                "badges": badges,
                "is_user": household_name == active_household,
                "zone": marker["zone"],
                "map_x": marker["x"],
                "map_y": marker["y"],
            }
        )

    leaderboard.sort(key=lambda item: item["saved_kwh"], reverse=True)
    for rank, household in enumerate(leaderboard, start=1):
        household["rank"] = rank
    return leaderboard


def build_eco_report(
    overview: dict[str, Any],
    insights: dict[str, Any],
    goals: list[dict[str, Any]],
    leaderboard: list[dict[str, Any]],
    household_name: str,
) -> dict[str, Any]:
    leaderboard_lookup = {item["name"]: item for item in leaderboard}
    household_entry = leaderboard_lookup.get(household_name, leaderboard_lookup.get(PRIMARY_HOUSEHOLD))
    household_rank = household_entry["rank"] if household_entry else 1
    badges = household_entry["badges"] if household_entry else ["Grid Guardian"]
    goal_count = sum(1 for goal in goals if goal["status"] in {"on_track", "done"})
    headline = (
        "Your home is below the city average this month."
        if overview["vs_city_pct"] <= 0
        else "Your home is above the city average this month."
    )

    return {
        "headline": headline,
        "subtitle": f"Eco score {overview['eco_score']} with rank #{household_rank} on the neighborhood board.",
        "badges": badges,
        "goal_count": goal_count,
        "stats": [
            {"label": "Monthly kWh", "value": overview["current_month_kwh"]},
            {"label": "Bill", "value": overview["monthly_cost_inr"]},
            {"label": "CO2 kg", "value": overview["carbon_kg"]},
            {"label": "Predicted bill", "value": insights["prediction"]["predicted_bill_inr"]},
        ],
        "share_text": (
            f"{household_name} used {overview['current_month_kwh']} kWh this month, "
            f"kept an eco score of {overview['eco_score']}, and currently sits at rank #{household_rank}."
        ),
    }


def build_notifications(
    overview: dict[str, Any],
    analytics: dict[str, Any],
    goals: list[dict[str, Any]],
    insights: dict[str, Any],
    pulse: dict[str, Any],
) -> list[dict[str, Any]]:
    notifications = [
        {
            "level": analytics["alerts"][0]["level"],
            "title": analytics["alerts"][0]["title"],
            "body": analytics["alerts"][0]["message"],
        },
        {
            "level": "info",
            "title": "Peak window detected",
            "body": f"Your heaviest load is clustering around {overview['peak_window']}.",
        },
        {
            "level": "info",
            "title": "Live pulse update",
            "body": f"{pulse['room_label']} is leading the live demand at {pulse['current_load_kw']} kW.",
        },
    ]
    if insights["anomalies"]:
        notifications.append(
            {
                "level": "warning",
                "title": "Anomaly spotted",
                "body": f"{insights['anomalies'][0]['date']} diverged by {insights['anomalies'][0]['deviation_pct']}% from baseline.",
            }
        )
    delayed_goal = next((goal for goal in goals if goal["status"] == "off_track"), None)
    if delayed_goal:
        notifications.append(
            {
                "level": "critical",
                "title": delayed_goal["title"],
                "body": delayed_goal["target"],
            }
        )
    return notifications[:5]


def build_recent_logs(user_logs: pd.DataFrame) -> list[dict[str, Any]]:
    recent = user_logs.sort_values("usage_date", ascending=False).head(12)
    return [
        {
            "id": int(row["id"]),
            "room": row["room"],
            "appliance_name": row["appliance_name"],
            "watts": round(float(row["watts"]), 1),
            "hours_per_day": round(float(row["hours_per_day"]), 2),
            "usage_date": pd.Timestamp(row["usage_date"]).date().isoformat(),
            "source": row["source"],
            "kwh": round(float(row["kwh"]), 2),
            "cost_inr": round(float(row["cost_inr"]), 2),
        }
        for _, row in recent.iterrows()
    ]


def insert_log_entry(payload: dict[str, Any]) -> None:
    room = payload.get("room") or infer_room_from_appliance(payload["appliance_name"])
    with get_connection() as connection:
        connection.execute(
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
            (
                payload.get("household_name", PRIMARY_HOUSEHOLD),
                room,
                payload["appliance_name"],
                float(payload["watts"]),
                float(payload["hours_per_day"]),
                payload["usage_date"],
                payload.get("source", "manual"),
            ),
        )
        connection.commit()


def import_bill_workbook(contents: bytes) -> dict[str, Any]:
    dataframe = pd.read_excel(BytesIO(contents))
    if dataframe.empty:
        raise ValueError("The uploaded workbook does not contain any rows.")

    normalized_columns = {column: normalize_label(column) for column in dataframe.columns}
    dataframe = dataframe.rename(columns=normalized_columns)

    column_aliases = {
        "appliance_name": {"appliance", "appliance_name", "device", "device_name", "name"},
        "room": {"room", "location", "area"},
        "watts": {"watts", "watt", "power", "power_w"},
        "hours_per_day": {"hours", "hours_per_day", "hours_used_per_day", "hours_day"},
        "usage_date": {"date", "usage_date", "day", "reading_date"},
        "household_name": {"household", "household_name", "home"},
    }

    resolved_columns: dict[str, str] = {}
    for target_name, aliases in column_aliases.items():
        for column in dataframe.columns:
            if column in aliases:
                resolved_columns[target_name] = column
                break

    for required in {"appliance_name", "watts", "hours_per_day"}:
        if required not in resolved_columns:
            raise ValueError(
                "The workbook must include appliance, watts, and hours columns to calculate energy usage."
            )

    import_rows: list[tuple[str, str, str, float, float, str, str]] = []
    preview: list[dict[str, Any]] = []

    for _, row in dataframe.iterrows():
        appliance_name = str(row[resolved_columns["appliance_name"]]).strip()
        watts = parse_numeric(row[resolved_columns["watts"]])
        hours = parse_numeric(row[resolved_columns["hours_per_day"]])
        if not appliance_name or watts is None or hours is None:
            continue

        room = (
            str(row[resolved_columns["room"]]).strip().lower().replace(" ", "_")
            if "room" in resolved_columns and not pd.isna(row[resolved_columns["room"]])
            else infer_room_from_appliance(appliance_name)
        )
        if room not in ROOM_LABELS:
            room = infer_room_from_appliance(appliance_name)

        usage_date = (
            pd.to_datetime(row[resolved_columns["usage_date"]]).date().isoformat()
            if "usage_date" in resolved_columns and not pd.isna(row[resolved_columns["usage_date"]])
            else date.today().isoformat()
        )
        household_name = (
            str(row[resolved_columns["household_name"]]).strip()
            if "household_name" in resolved_columns and not pd.isna(row[resolved_columns["household_name"]])
            else PRIMARY_HOUSEHOLD
        )

        import_rows.append(
            (
                household_name,
                room,
                appliance_name,
                float(watts),
                float(hours),
                usage_date,
                "bill_upload",
            )
        )

        if len(preview) < 5:
            preview.append(
                {
                    "room": ROOM_LABELS.get(room, room.title()),
                    "appliance_name": appliance_name,
                    "watts": round(float(watts), 1),
                    "hours_per_day": round(float(hours), 2),
                    "usage_date": usage_date,
                }
            )

    if not import_rows:
        raise ValueError("No valid appliance rows were found in the workbook.")

    with get_connection() as connection:
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
            import_rows,
        )
        connection.commit()

    return {"imported_rows": len(import_rows), "preview": preview}


def generate_excel_report(household_name: str = PRIMARY_HOUSEHOLD) -> bytes:
    payload = build_dashboard_payload(household_name)
    active_household = payload["profile"]["active_household"]
    logs_df = fetch_logs_df(active_household).copy()
    logs_df["usage_date"] = logs_df["usage_date"].dt.date

    summary_df = pd.DataFrame(
        [
            ["Month", payload["overview"]["month_label"]],
            ["Household", active_household],
            ["Monthly kWh", payload["overview"]["current_month_kwh"]],
            ["Monthly cost (INR)", payload["overview"]["monthly_cost_inr"]],
            ["Carbon (kg CO2)", payload["overview"]["carbon_kg"]],
            ["Budget used (%)", payload["overview"]["budget_used_pct"]],
            ["Top appliance", payload["overview"]["top_appliance"]["name"]],
            ["Predicted next bill (INR)", payload["insights"]["prediction"]["predicted_bill_inr"]],
            ["Peak window", payload["overview"]["peak_window"]],
        ],
        columns=["Metric", "Value"],
    )
    insights_df = pd.DataFrame(payload["insights"]["tips"])
    leaderboard_df = pd.DataFrame(payload["leaderboard"])
    goals_df = pd.DataFrame(payload["goals"])
    appliance_df = pd.DataFrame(payload["bill_breakdown"]["by_appliance"])
    room_df = pd.DataFrame(payload["bill_breakdown"]["by_room"])

    output = BytesIO()
    with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
        logs_df.to_excel(writer, sheet_name="Logs", index=False)
        summary_df.to_excel(writer, sheet_name="Summary", index=False)
        insights_df.to_excel(writer, sheet_name="Smart Tips", index=False)
        leaderboard_df.to_excel(writer, sheet_name="Leaderboard", index=False)
        goals_df.to_excel(writer, sheet_name="Goals", index=False)
        appliance_df.to_excel(writer, sheet_name="Cost by Appliance", index=False)
        room_df.to_excel(writer, sheet_name="Cost by Room", index=False)

        workbook = writer.book
        sheet_map = {
            "Logs": logs_df,
            "Summary": summary_df,
            "Smart Tips": insights_df,
            "Leaderboard": leaderboard_df,
            "Goals": goals_df,
            "Cost by Appliance": appliance_df,
            "Cost by Room": room_df,
        }
        for sheet_name, dataframe in sheet_map.items():
            worksheet = writer.sheets[sheet_name]
            worksheet.freeze_panes(1, 0)
            worksheet.autofilter(0, 0, max(len(dataframe), 1), max(len(dataframe.columns) - 1, 0))
            for index, column in enumerate(dataframe.columns):
                width = max(len(str(column)) + 4, 16)
                worksheet.set_column(index, index, min(width, 28))

            header_format = workbook.add_format(
                {
                    "bold": True,
                    "font_color": "#DFFCF6",
                    "bg_color": "#0F766E",
                    "border": 0,
                }
            )
            for column_index, header in enumerate(dataframe.columns):
                worksheet.write(0, column_index, header, header_format)

    return output.getvalue()


def estimate_hourly_profile(source_df: pd.DataFrame) -> list[float]:
    profile = [0.0] * 24
    if source_df.empty:
        return profile

    grouped = (
        source_df.groupby(["appliance_name", "watts"])
        .agg(hours_per_day=("hours_per_day", "mean"))
        .reset_index()
    )
    for _, row in grouped.iterrows():
        appliance = str(row["appliance_name"])
        watts = float(row["watts"])
        hours = float(row["hours_per_day"])
        distribution = appliance_hour_distribution(appliance)
        total_weight = sum(distribution) or 1.0
        daily_kwh = (watts / 1000.0) * hours
        for hour, weight in enumerate(distribution):
            profile[hour] += daily_kwh * (weight / total_weight)
    return profile


def appliance_hour_distribution(appliance_name: str) -> list[float]:
    name = appliance_name.lower()
    weights = [0.1] * 24
    if "ac" in name:
        for hour in [13, 14, 15, 20, 21, 22, 23]:
            weights[hour] = 1.6
    elif "refrigerator" in name or "purifier" in name:
        weights = [0.9] * 24
    elif "light" in name or "lamp" in name:
        for hour in [18, 19, 20, 21, 22, 23]:
            weights[hour] = 1.5
    elif "tv" in name or "console" in name or "soundbar" in name:
        for hour in [19, 20, 21, 22]:
            weights[hour] = 1.7
    elif "water heater" in name:
        for hour in [6, 7, 8]:
            weights[hour] = 1.8
    elif "washing machine" in name or "dishwasher" in name:
        for hour in [10, 11, 12, 13]:
            weights[hour] = 1.4
    elif "microwave" in name or "cooktop" in name or "induction" in name:
        for hour in [7, 8, 13, 19, 20]:
            weights[hour] = 1.6
    elif "fan" in name:
        for hour in [0, 1, 2, 3, 4, 5, 22, 23]:
            weights[hour] = 1.2
    elif "laptop" in name:
        for hour in [9, 10, 11, 14, 15, 20]:
            weights[hour] = 1.2
    else:
        for hour in range(9, 22):
            weights[hour] = 0.9
    return weights


def format_peak_window(hourly_profile: list[float]) -> str:
    if not hourly_profile:
        return "7 PM - 9 PM"
    best_hour = max(range(23), key=lambda hour: hourly_profile[hour] + hourly_profile[(hour + 1) % 24])
    start_label = format_hour(best_hour)
    end_label = format_hour((best_hour + 2) % 24)
    return f"{start_label} - {end_label}"


def synthetic_temperature(target_day: date) -> float:
    day_of_year = target_day.timetuple().tm_yday
    weekday = target_day.weekday()
    seasonal = 30.0 + 5.5 * math.sin((day_of_year - 65) * 2 * math.pi / 365)
    weekly_variation = 1.8 * math.cos((weekday / 6.0) * math.pi)
    micro_variation = 0.9 * math.sin((day_of_year + weekday * 3) * 0.55)
    return seasonal + weekly_variation + micro_variation


def weather_condition(temp_c: float) -> str:
    if temp_c >= 34:
        return "Heatwave"
    if temp_c >= 30:
        return "Hot"
    if temp_c >= 26:
        return "Warm"
    return "Mild"


def upcoming_weather_risk(temp_c: float) -> str:
    if temp_c >= 34:
        return "watch"
    if temp_c >= 30:
        return "steady"
    return "low"


def level_from_ratio(normalized_value: float) -> str:
    if normalized_value < 0.45:
        return "green"
    if normalized_value < 0.78:
        return "yellow"
    return "red"


def color_from_level(level: str) -> str:
    if level == "green":
        return "#22c55e"
    if level == "yellow":
        return "#facc15"
    return "#ef4444"


def normalize_label(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.strip().lower()).strip("_")


def parse_numeric(value: Any) -> float | None:
    if pd.isna(value):
        return None
    if isinstance(value, (int, float, np.number)):
        return float(value)

    match = re.search(r"[-+]?\d*\.?\d+", str(value).replace(",", ""))
    return float(match.group(0)) if match else None


def anomaly_reason(current_value: float, baseline: float) -> str:
    if current_value >= baseline * 1.45:
        return "Sharp cooling or heating spike above the recent daily baseline."
    if current_value <= baseline * 0.65:
        return "Usage dropped unusually low compared with the normal daily pattern."
    return "The daily load shape was unusual compared with recent behavior."


def safe_pct_delta(current: float, previous: float) -> float:
    if previous == 0:
        return 0.0
    return round(((current - previous) / previous) * 100, 1)


def format_hour(hour: int) -> str:
    base = hour % 24
    suffix = "AM" if base < 12 else "PM"
    display = 12 if base % 12 == 0 else base % 12
    return f"{display} {suffix}"
