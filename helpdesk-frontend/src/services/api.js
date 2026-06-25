const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const AUTH_STORAGE_KEY = "helpdeskCurrentUser";

async function parseApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(`API error: ${response.status}`);
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload;
}

function getAuthHeaders() {
  const currentUser = getCurrentUser();

  if (!currentUser?.token) {
    return {};
  }

  return {
    Authorization: `Token ${currentUser.token}`,
  };
}

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  return parseApiResponse(response);
}

export function getCurrentUser() {
  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveCurrentUser(user) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

export async function registerUser(payload, options = {}) {
  const user = await apiRequest("/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (options.persistSession !== false) {
    saveCurrentUser(user);
  }

  return user;
}

export async function loginUser(payload) {
  const user = await apiRequest("/auth/login/", {
    method: "POST",
    body: JSON.stringify({
      username_or_email: payload.usernameOrEmail,
      password: payload.password,
    }),
  });
  saveCurrentUser(user);
  return user;
}

export function getUsers() {
  return apiRequest("/users/");
}

export function createUser(payload) {
  return apiRequest("/users/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCategories() {
  return apiRequest("/categories/");
}

export function createCategory(payload) {
  return apiRequest("/categories/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTickets(params) {
  return apiRequest(`/tickets/${buildQueryString(params)}`);
}

export async function getTicketResults(params) {
  const payload = await getTickets(params);
  return Array.isArray(payload) ? payload : payload.results;
}

export function createTicket(payload) {
  return apiRequest("/tickets/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTicket(id, payload) {
  return apiRequest(`/tickets/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getTicketById(id) {
  return apiRequest(`/tickets/${id}/`);
}

export function getTicketHistory(id) {
  return apiRequest(`/tickets/${id}/history/`);
}

export function getDashboardMetrics() {
  return apiRequest("/tickets/dashboard/");
}

export function getTicketComments(id) {
  return apiRequest(`/tickets/${id}/comments/`);
}

export function createTicketComment(id, payload) {
  return apiRequest(`/tickets/${id}/comments/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
