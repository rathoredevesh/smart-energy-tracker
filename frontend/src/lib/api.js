const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

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
  const response = await fetch(`${API_BASE}/api/dashboard${query ? `?${query}` : ""}`);
  return handleResponse(response);
}

export async function createEnergyLog(payload) {
  const response = await fetch(`${API_BASE}/api/logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function uploadBillWorkbook(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/bills/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(response);
}

export function getReportExportUrl(householdName) {
  const search = new URLSearchParams();
  if (householdName) {
    search.set("household_name", householdName);
  }
  const query = search.toString();
  return `${API_BASE}/api/export/report${query ? `?${query}` : ""}`;
}
