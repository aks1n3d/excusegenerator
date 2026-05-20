/**
 * Frontend → Cloudflare Worker → Gemini.
 *
 * Dev: VITE_API_BASE_URL is empty, so requests are relative ('/api/...')
 *      and Vite's proxy forwards them to http://localhost:8787.
 * Prod: VITE_API_BASE_URL is the deployed Worker's URL
 *      (e.g. https://whoopsie-worker.your-account.workers.dev). Worker has CORS '*'.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export class ExcuseError extends Error {
  constructor(code, message) {
    super(message || code)
    this.code = code
  }
}

export async function generateExcuses({ situation, intensity, tone, locale, category }) {
  let resp
  try {
    resp = await fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ situation, intensity, tone, locale, category }),
    })
  } catch (err) {
    throw new ExcuseError('network', err?.message)
  }

  let data = null
  try {
    data = await resp.json()
  } catch {}

  if (!resp.ok) {
    throw new ExcuseError(data?.error || `http_${resp.status}`, `HTTP ${resp.status}`)
  }
  const excuses = Array.isArray(data?.excuses) ? data.excuses : []
  if (excuses.length === 0) throw new ExcuseError('empty', 'Worker returned no excuses')
  return excuses
}

export async function fetchDailyExcuse(locale) {
  const resp = await fetch(`${API_BASE}/api/daily?locale=${encodeURIComponent(locale)}`)
  if (!resp.ok) throw new ExcuseError('daily_failed', `HTTP ${resp.status}`)
  return resp.json()
}
