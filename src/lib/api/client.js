/**
 * Minimal typed-ish fetch wrapper for the StreamHub API.
 *
 * The API is same-origin (`/api`), proxied by Vite in dev and served by the
 * Fastify server in production, so no CORS or base-URL configuration is needed
 * unless you point the client somewhere else.
 */

const TOKEN_KEY = "streamhub_token"

const BASE = String(import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "")

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.status = status
  }
}

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* private mode / storage disabled */
  }
}

export function clearToken() {
  setToken(null)
}

/**
 * @param {string} path  path under the API root, e.g. "/streams?status=live"
 * @param {{ method?: string, body?: unknown, auth?: boolean, signal?: AbortSignal }} options
 */
export async function request(path, { method = "GET", body, auth = true, signal } = {}) {
  const headers = { Accept: "application/json" }

  if (body !== undefined) headers["Content-Type"] = "application/json"

  const token = auth ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    if (err?.name === "AbortError") throw err
    throw new ApiError(
      "Could not reach the StreamHub API. Is the server running? (pnpm dev)",
      "NETWORK_ERROR",
      0,
    )
  }

  const raw = await response.text()
  let data = null
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const message = data?.error || `Request failed with status ${response.status}`
    const code = data?.code || String(response.status)
    // An expired/invalid token should never linger in storage.
    if (response.status === 401) clearToken()
    throw new ApiError(message, code, response.status)
  }

  return data
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  del: (path, options) => request(path, { ...options, method: "DELETE" }),
}
