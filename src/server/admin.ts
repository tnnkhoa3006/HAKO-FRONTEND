const API_ROOT = process.env.NEXT_PUBLIC_API_URL;
const BASE = API_ROOT ? `${API_ROOT.replace(/\/$/, "")}/api/admin` : "";

async function readJsonSafe<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(res.ok ? "Phản hồi không phải JSON" : `Lỗi ${res.status}`);
  }
}

async function readApiResult<T extends Record<string, unknown>>(res: Response): Promise<T> {
  const data = await readJsonSafe<T>(res);
  if (!res.ok) {
    const msg =
      typeof data.message === "string" ? data.message : `Lỗi ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

type UsersListBody = { users?: Record<string, unknown>[]; message?: string };
type PostsListBody = { posts?: Record<string, unknown>[]; message?: string };
type StoriesListBody = { stories?: Record<string, unknown>[]; message?: string };

function authHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("authToken");
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  return headers;
}

export async function adminFetch(path: string, init?: RequestInit) {
  if (!BASE) {
    throw new Error("Chưa cấu hình NEXT_PUBLIC_API_URL");
  }
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers || {}) },
    credentials: "include",
  });
}

export async function listAdminUsers(params?: { page?: number; q?: string }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.q) q.set("q", params.q);
  const res = await adminFetch(`/users?${q}`);
  return readApiResult<UsersListBody>(res);
}

export async function createAdminUser(body: Record<string, unknown>) {
  const res = await adminFetch("/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return readApiResult(res);
}

export async function updateAdminUser(
  id: string,
  body: Record<string, unknown>
) {
  const res = await adminFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return readApiResult(res);
}

export async function deleteAdminUser(id: string) {
  const res = await adminFetch(`/users/${id}`, { method: "DELETE" });
  return readApiResult(res);
}

export async function notifyAdminUsers(body: {
  message: string;
  broadcast?: boolean;
  userIds?: string[];
}) {
  const res = await adminFetch("/notify", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return readApiResult(res);
}

export async function listAdminPosts() {
  const res = await adminFetch("/posts");
  return readApiResult<PostsListBody>(res);
}

export async function deleteAdminPost(postId: string) {
  const res = await adminFetch(`/posts/${postId}`, { method: "DELETE" });
  return readApiResult(res);
}

export async function listAdminStories() {
  const res = await adminFetch("/stories");
  return readApiResult<StoriesListBody>(res);
}

export async function deleteAdminStory(storyId: string) {
  const res = await adminFetch(`/stories/${storyId}`, { method: "DELETE" });
  return readApiResult(res);
}

export async function seedSampleData() {
  const res = await adminFetch("/seed-sample-data", { method: "POST" });
  return readApiResult(res);
}

export async function createAdminPost(form: FormData) {
  if (!BASE) {
    throw new Error("Chưa cấu hình NEXT_PUBLIC_API_URL");
  }
  const headers: HeadersInit = {};
  const t =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  if (t) headers["Authorization"] = `Bearer ${t}`;
  const res = await fetch(`${BASE}/posts`, {
    method: "POST",
    body: form,
    credentials: "include",
    headers,
  });
  return readApiResult(res);
}

export async function createAdminStory(form: FormData) {
  if (!BASE) {
    throw new Error("Chưa cấu hình NEXT_PUBLIC_API_URL");
  }
  const headers: HeadersInit = {};
  const t =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  if (t) headers["Authorization"] = `Bearer ${t}`;
  const res = await fetch(`${BASE}/stories`, {
    method: "POST",
    body: form,
    credentials: "include",
    headers,
  });
  return readApiResult(res);
}
