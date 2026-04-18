# Smart Energy Tracker Deployment

This repo is now prepared for **Render Blueprint deployment** using:

- [render.yaml](/D:/Smart_Energy/render.yaml)

That means Render can create both services from one file.

This project is easiest to deploy as:

- `frontend/` -> Render Static Site
- `backend/` -> Render Web Service

That keeps the full stack on one platform and works well with this monorepo layout.

## Fastest path

1. Push the latest project files to GitHub.
2. Go to Render.
3. Choose `New > Blueprint`.
4. Select your GitHub repo.
5. Render will detect `render.yaml`.
6. During setup, enter values for:

- `FRONTEND_ORIGINS`
- `VITE_API_BASE_URL`

Use:

- `FRONTEND_ORIGINS=https://your-frontend-service.onrender.com`
- `VITE_API_BASE_URL=https://your-backend-service.onrender.com`

After both services are created, if Render gave different final URLs, update those env vars once in the dashboard and redeploy.

## 1. Push the project to GitHub

Create a GitHub repository and push the full `Smart_Energy` folder.

## 2. Deploy the backend on Render

Create a new **Web Service** on Render and connect your GitHub repo.

Use these settings:

- Root Directory: `backend`
- Environment: `Python 3`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Add this environment variable:

- `FRONTEND_ORIGINS=https://your-frontend-site.onrender.com`

After deploy, note your backend URL, for example:

- `https://smart-energy-api.onrender.com`

Check this endpoint:

- `https://your-backend-url/api/health`

It should return:

```json
{"status":"ok"}
```

## 3. Deploy the frontend on Render

Create a new **Static Site** on Render and connect the same GitHub repo.

Use these settings:

- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Add this environment variable:

- `VITE_API_BASE_URL=https://your-backend-service.onrender.com`

Then deploy.

## 4. Update backend CORS

If your frontend URL changes, update backend env:

- `FRONTEND_ORIGINS=https://your-frontend-site.onrender.com`

If you use a custom domain later, add it too:

- `FRONTEND_ORIGINS=https://your-frontend-site.onrender.com,https://energy.yourdomain.com`

## 5. Important note about SQLite

The backend currently stores data in SQLite at:

- `backend/data/smart_energy.db`

The app now supports overriding the database location with:

- `SMART_ENERGY_DB_PATH`

On Render, local filesystem is ephemeral by default, which means SQLite data can reset after restart or redeploy unless you attach a persistent disk.

For a demo:

- you can deploy as-is

For persistent data:

- attach a Render persistent disk to the backend service
- then set `SMART_ENERGY_DB_PATH` to a file inside that mount, for example:
  - `/var/data/smart_energy.db`

The simplest long-term production upgrade is moving from SQLite to Postgres, but for a portfolio/demo deploy the persistent disk route is enough.

## 6. Custom domain

Once both services are live, you can add your custom domain in Render settings.

## 7. Quick checklist

- Backend live and `/api/health` works
- Frontend env `VITE_API_BASE_URL` points to backend
- Backend env `FRONTEND_ORIGINS` points to frontend
- Frontend loads data instead of calling `localhost`
