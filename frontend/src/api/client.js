export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function apiRequest(
  endpoint,
  options = {}
) {
  const token = localStorage.getItem("meridian_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Add JWT if the user is logged in
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Something went wrong."
    );
  }

  return data;
}