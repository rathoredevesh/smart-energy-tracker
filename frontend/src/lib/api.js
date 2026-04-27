const LOCAL_API_BASE = "http://localhost:8000";
const GITHUB_PAGES_API_BASE = "https://smart-energy-api-h9cr.onrender.com";
const API_BASE = resolveApiBase();
const DEFAULT_TIMEOUT_MS = 15000;
const DASHBOARD_TIMEOUT_MS = 9000;

function trimTrailingSlash(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

function isLocalHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function resolveApiBase() {
  const configuredBase = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL);
  if (configuredBase) {
    return configuredBase;
  }

  if (typeof window === "undefined") {
    return LOCAL_API_BASE;
  }

  if (isLocalHostname(window.location.hostname)) {
    return LOCAL_API_BASE;
  }

  if (window.location.hostname.endsWith(".github.io")) {
    return GITHUB_PAGES_API_BASE;
  }

  return LOCAL_API_BASE;
}

function toRequestError(error, timeoutMessage) {
  if (error?.name === "AbortError") {
    return new Error(timeoutMessage);
  }

  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return new Error(
      "The live energy API could not be reached. If you are on the GitHub Pages deployment, the backend may still be waking up or blocking this origin. Please retry in a few seconds.",
    );
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Something went wrong while contacting the API.");
}

async function request(path, options = {}, config = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    timeoutMessage = "The API took too long to respond.",
  } = config;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
    });
    return handleResponse(response);
  } catch (error) {
    throw toRequestError(error, timeoutMessage);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    let detail = "Something went wrong while contacting the API.";
    try {
      const body = await response.json();
      detail = body.detail ?? body.message ?? detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  return response.json();
}

export async function fetchDashboard(householdName) {
  const search = new URLSearchParams();
  if (householdName) {
    search.set("household_name", householdName);
  }
  const query = search.toString();
  return request(`/api/dashboard${query ? `?${query}` : ""}`, {}, {
    timeoutMs: DASHBOARD_TIMEOUT_MS,
    timeoutMessage:
      "Live data is taking longer than expected. Showing cached values while the backend wakes up.",
  });
}

export async function createEnergyLog(payload) {
  return request("/api/logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function uploadBillWorkbook(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/api/bills/upload", {
    method: "POST",
    body: formData,
  }, {
    timeoutMs: 30000,
    timeoutMessage: "The bill upload is taking too long. Please try again.",
  });
}

export function getReportExportUrl(householdName) {
  const search = new URLSearchParams();
  if (householdName) {
    search.set("household_name", householdName);
  }
  const query = search.toString();
  return `${API_BASE}/api/export/report${query ? `?${query}` : ""}`;
}
