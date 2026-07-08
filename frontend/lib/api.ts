/**
 * @ai-restriction
 * Primary Owners: Umer & Talha
 * Umer: Allowed to define client-side data fetching logic here.
 * Talha: Allowed to define endpoint interfaces ensuring backend parity.
 * Mohsin: Do not modify standard REST hooks. Use separate files for WebRTC/Voice logic if needed.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const fetchCurriculum = async () => {
  // Placeholder API call
  return { message: "Curriculum logic goes here" };
};

export const signup = async (payload: any) => {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  let data;
  try {
    data = await res.json();
  } catch (err) {
    // Next.js proxy returns empty body if backend is not running
    if (!res.ok) throw new Error(`Could not connect to backend (Status ${res.status}). Is FastAPI running?`);
    data = {};
  }
  
  if (!res.ok) {
    if (data?.detail && Array.isArray(data.detail)) {
      throw new Error(data.detail[0].msg); // e.g. "String should have at least 8 characters"
    }
    throw new Error(data?.detail || "Signup failed");
  }
  return data;
};

export const login = async (payload: any) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  let data;
  try {
    data = await res.json();
  } catch (err) {
    if (!res.ok) throw new Error(`Could not connect to backend (Status ${res.status}). Is FastAPI running?`);
    data = {};
  }

  if (!res.ok) {
    if (data?.detail && Array.isArray(data.detail)) {
      throw new Error(data.detail[0].msg);
    }
    throw new Error(data?.detail || "Login failed");
  }
  return data;
};
