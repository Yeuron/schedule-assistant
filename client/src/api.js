const BASE = "/api";

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  getProductMaster: () => request("GET", "/product-master"),
  getTasks: () => request("GET", "/tasks"),
  createTask: (task) => request("POST", "/tasks", task),
  updateTask: (id, change) => request("PUT", `/tasks/${id}`, change),
  deleteTask: (id) => request("DELETE", `/tasks/${id}`),
};
