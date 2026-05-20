/**
 * Frontend → Cloudflare Worker → Gemini.
 * In dev, Vite's proxy forwards `/api/*` → `http://localhost:8787`.
 */

export class ExcuseError extends Error {
  constructor(code, message) {
    super(message || code)
    this.code = code
  }
}

export async function generateExcuses({ situation, intensity, tone, locale, category }) {
  let resp
  try {
    resp = await fetch('/api/generate', {
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
  const resp = await fetch(`/api/daily?locale=${encodeURIComponent(locale)}`)
  if (!resp.ok) throw new ExcuseError('daily_failed', `HTTP ${resp.status}`)
  return resp.json()
}
