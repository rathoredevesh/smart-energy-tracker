# Smart Energy Consumption Tracker

A full-stack smart energy monitoring experience with:

- React + Vite + Tailwind CSS
- React Three Fiber / Three.js for immersive 3D scenes
- GSAP scroll-triggered motion
- Chart.js analytics
- FastAPI + SQLite backend
- Pandas-powered Excel import/export
- Scikit-learn bill prediction and anomaly detection

## Project Structure

```text
frontend/   React app
backend/    FastAPI service
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://localhost:8000` by default.

To override it:

```bash
set VITE_API_BASE_URL=http://localhost:8000
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend seeds a SQLite database automatically on first startup.

For the smoothest dependency install, use Python `3.12` or `3.13`. Some scientific packages may not yet publish wheels for newer Python releases.

## Excel Upload Format

The upload parser is flexible, but the happiest path is an `.xlsx` sheet with columns like:

- `room`
- `appliance`
- `watts`
- `hours used per day`
- `date`

Alternative headings such as `device`, `power`, `usage date`, and `hours` are also accepted.

## Features Included

- Full-screen neon 3D hero scene with animated energy meter and skyline
- Interactive 3D house with per-room glow states and appliance side panel
- Manual energy logging with historical date selection
- Excel bill import and Excel report export
- Weekly/monthly analytics, trend chart, and heatmap calendar
- AI insight cards with prediction, anomaly detection, and saving tips
- Eco impact visual with CO2 conversion, adaptive tree, and city comparison
- Eco leaderboard with milestone badges
- Responsive mobile fallback with simplified 2D panels
