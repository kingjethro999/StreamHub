/**
 * Domain-level API for StreamHub.
 *
 * This replaces the Supabase query builder that used to live in
 * `src/lib/supabase/client.js`. Response shapes match what the UI already
 * expects:
 *   - list endpoints return arrays
 *   - single-resource endpoints return the object (or `{ channel }`)
 *   - errors are `ApiError` with `.code` mirroring the old SQLSTATE codes
 */
import { api, getToken, setToken, clearToken, ApiError } from "./client.js"

export { ApiError }

function toQuery(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === "all") continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function login(email, password) {
  const { token, user } = await api.post("/auth/login", { email, password }, { auth: false })
  setToken(token)
  return user
}

export async function register({ email, password, username }) {
  const { token, user } = await api.post(
    "/auth/register",
    { email, password, username },
    { auth: false },
  )
  setToken(token)
  return user
}

/**
 * Returns the signed-in user, or `null` when nobody is signed in (or the
 * token has expired). Never throws for the "not logged in" case.
 */
export async function getCurrentUser({ signal } = {}) {
  if (!getToken()) return null
  try {
    const { user } = await api.get("/auth/me", { signal })
    return user ?? null
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    if (err?.name === "AbortError") return null
    throw err
  }
}

export function logout() {
  clearToken()
}

export function isAuthenticated() {
  return Boolean(getToken())
}

// ---------------------------------------------------------------------------
// Streams
// ---------------------------------------------------------------------------

/** @param {{status?: string, category?: string, q?: string, channel_id?: string, order?: string, dir?: string, limit?: number}} params */
export function listStreams(params = {}) {
  return api.get(`/streams${toQuery(params)}`)
}

export function getStream(id) {
  return api.get(`/streams/${encodeURIComponent(id)}`)
}

export function createStream(body) {
  return api.post("/streams", body)
}

export function deleteStream(id) {
  return api.del(`/streams/${encodeURIComponent(id)}`)
}

export function recordStreamView(id) {
  return api.post(`/streams/${encodeURIComponent(id)}/view`, {})
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

/** @returns {Promise<object|null>} */
export async function getMyChannel() {
  const { channel } = await api.get("/channels/me")
  return channel ?? null
}

export async function saveMyChannel(body) {
  const { channel } = await api.put("/channels/me", body)
  return channel
}

export async function getChannel(id) {
  const { channel } = await api.get(`/channels/${encodeURIComponent(id)}`)
  return channel
}

export function getChannelStreams(id) {
  return api.get(`/channels/${encodeURIComponent(id)}/streams`)
}

// ---------------------------------------------------------------------------
// Likes / reposts
// ---------------------------------------------------------------------------

export function getLikeState(streamId) {
  return api.get(`/likes${toQuery({ stream_id: streamId })}`)
}

export function likeStream(streamId) {
  return api.put("/likes", { stream_id: streamId })
}

export function unlikeStream(streamId) {
  return api.del(`/likes${toQuery({ stream_id: streamId })}`)
}

export function repostStream(streamId, caption) {
  return api.post("/reposts", { stream_id: streamId, caption })
}

export function getMyReposts() {
  return api.get("/reposts")
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export function getComments(streamId) {
  return api.get(`/comments${toQuery({ stream_id: streamId })}`)
}

export function postComment(streamId, content) {
  return api.post("/comments", { stream_id: streamId, content })
}

// ---------------------------------------------------------------------------
// Follows
// ---------------------------------------------------------------------------

export function getMyFollows() {
  return api.get("/follows/me")
}

export function followChannel(channelId) {
  return api.post("/follows", { channel_id: channelId })
}

export function unfollowChannel(channelId) {
  return api.del(`/follows${toQuery({ channel_id: channelId })}`)
}

export function isFollowing(channelId) {
  return api.get(`/follows/check${toQuery({ channel_id: channelId })}`)
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function notifyFollowers(payload) {
  return api.post("/notify-followers", payload)
}
