/**
 * Thin server-side client for the NVIDIA hosted API
 * (https://integrate.api.nvidia.com/v1).
 *
 * The NVIDIA_API_KEY never leaves this module: it is read from server env and
 * used only in Authorization headers on direct fetch calls. No key or secret is
 * ever returned to, or bundled into, the browser.
 *
 * Usage:
 *   import { nvidiaConfigured, nvidiaChatCompletions } from "./nvidia.js"
 *   if (!nvidiaConfigured()) return // AI features unavailable
 *   const data = await nvidiaChatCompletions({ model, messages, stream: false })
 */
import { config } from "../env.js"

const base = config.nvidia.apiBase.replace(/\/+$/, "")

/** True when a NVIDIA API key is configured, so AI features can be offered. */
export function nvidiaConfigured() {
  return Boolean(config.nvidia.apiKey)
}

/** Human-readable reason why AI features are unavailable, or null. */
export function nvidiaUnavailableReason() {
  if (!config.nvidia.apiKey) {
    return "Set NVIDIA_API_KEY in .env to enable AI features."
  }
  return null
}

/**
 * Call the NVIDIA chat/completions endpoint.
 *
 * @param {object} params
 * @param {string} params.model - NVIDIA model id (e.g. a Nemotron VL/reasoning model)
 * @param {Array} params.messages - OpenAI-compatible message array
 * @param {number} [params.temperature]
 * @param {number} [params.topP]
 * @param {number} [params.maxTokens]
 * @param {boolean} [params.stream] - when true, returns the raw Response (NDJSON stream)
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<import("node:http").IncomingMessage|Response|object>}
 */
export async function nvidiaChatCompletions({
  model,
  messages,
  temperature = 0.7,
  topP = 1,
  maxTokens,
  stream = false,
  signal,
} = {}) {
  if (!config.nvidia.apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured. AI features are disabled.")
  }

  const body = {
    model,
    messages,
    temperature,
    top_p: topP,
    ...(maxTokens != null ? { max_tokens: maxTokens } : {}),
    stream,
  }

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.nvidia.apiKey}`,
      Accept: stream ? "text/event-stream" : "application/json",
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`NVIDIA API ${res.status}: ${text.slice(0, 500)}`)
  }

  if (stream) return res
  return res.json()
}
