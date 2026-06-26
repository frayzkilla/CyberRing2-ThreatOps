import type {
  Task,
  RecentTaskFeedItem,
  CreateTaskPayload,
  UpdateStatusPayload,
  AuthUser,
} from "./types";

const BASE_URL = "/tasks";
const AUTH_URL = "/auth";

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser): void {
  localStorage.setItem("auth_user", JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem("auth_user");
}

function authHeader(): Record<string, string> {
  const user = getStoredUser();
  return user ? { Authorization: `Bearer ${user.token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) message = body.detail;
    } catch {}
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function registerUser(
  username: string,
  password: string,
): Promise<AuthUser> {
  const res = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const user = await handleResponse<AuthUser>(res);
  storeUser(user);
  return user;
}

export async function loginUser(
  username: string,
  password: string,
): Promise<AuthUser> {
  const res = await fetch(`${AUTH_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const user = await handleResponse<AuthUser>(res);
  storeUser(user);
  return user;
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${AUTH_URL}/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });
  await handleResponse<{ message: string }>(res);
}

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${BASE_URL}/`, { headers: authHeader() });
  return handleResponse<Task[]>(res);
}

export async function fetchRecentTasksFeed(): Promise<RecentTaskFeedItem[]> {
  const res = await fetch("/internal/tasks/latest");
  return handleResponse<RecentTaskFeedItem[]>(res);
}

export async function fetchTask(id: number): Promise<Task> {
  const res = await fetch(`${BASE_URL}/${id}`, { headers: authHeader() });
  return handleResponse<Task>(res);
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const form = new FormData();
  form.append("title", payload.title);
  form.append("label", payload.label);
  form.append("priority", String(payload.priority));
  form.append("visibility", payload.visibility ?? "private");
  if (payload.description) form.append("description", payload.description);
  if (payload.comments) form.append("comments", payload.comments);
  if (payload.file) form.append("file", payload.file);

  const res = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: authHeader(),
    body: form,
  });
  return handleResponse<Task>(res);
}

export async function updateTaskStatus(
  id: number,
  payload: UpdateStatusPayload,
): Promise<Task> {
  const res = await fetch(`${BASE_URL}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  return handleResponse<Task>(res);
}

export async function downloadTaskFile(id: number): Promise<Blob> {
  const res = await fetch(`${BASE_URL}/${id}/file`, { headers: authHeader() });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.blob();
}

export async function downloadReport(id: number): Promise<Blob> {
  const res = await fetch(`${BASE_URL}/${id}/report`, {
    headers: authHeader(),
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) message = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.blob();
}

export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
