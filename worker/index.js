// Whoopsie Cloudflare Worker.
// - POST /api/generate → 3 excuses for (situation, intensity, tone, locale, [category])
// - GET  /api/daily?locale=xx → today's Whoopsie of the Day (cached 24h at the edge)
// Key never leaves the Worker. Locally: `.dev.vars`. In prod: `wrangler secret put GEMINI_API_KEY`.
// Free key: https://aistudio.google.com/apikey

const SITUATION_LABELS = {
  'late-work': 'is running late for work',
  'skip-date': 'wants to skip / cancel a date',
  'missed-deadline': 'missed a work or school deadline',
  'family-event': 'wants to skip a family event',
  'skip-gym': 'wants to skip the gym',
  'leave-party': 'wants to leave a party early',
}

const INTENSITY_INSTRUCTIONS = {
  mild: 'small, harmless white lies anyone would accept without follow-up',
  believable: 'plausible everyday excuses with one concrete specific detail that makes them feel real',
  unhinged: 'creative, absurd, slightly chaotic but still a coherent narrative — leave the reader unsure if it could possibly be true',
}

const TONE_INSTRUCTIONS = {
  apologetic: 'apologetic and sheepish, sprinkled with "sorry" and remorse',
  dramatic: 'theatrical, over-the-top, melodramatic phrasing',
  professional: 'formal, polished, work-appropriate phrasing',
}

const LOCALE_NAMES = {
  en: 'English',
  de: 'German',
  uk: 'Ukrainian',
  ru: 'Russian',
}

const CATEGORY_CONTEXTS = {
  'austrian-boss': 'an Austrian corporate boss with strict workplace formality, a sharp memory, and zero patience for vague excuses',
  'german-mil': 'a German mother-in-law with high expectations about punctuality, politeness, and dietary commentary',
  'ukrainian-mom': 'a Ukrainian mom who worries about whether you ate, dressed warmly enough, and called your grandma this week',
  'russian-babushka': 'a Russian babushka whose entire emotional response stems from whether you have eaten enough',
  'gym-trainer': 'a personal trainer who tracks every missed session and asks performance-coded follow-up questions',
  teacher: 'a strict teacher or professor who has heard every excuse already and is bored',
  'gen-z-friends': 'a group chat of Gen-Z friends who will roast you mercilessly if the excuse is mid',
}

// Locked-down CORS allow-list. Add any environment/preview origins here.
const ALLOWED_ORIGINS = new Set([
  'https://whoopsie.aks1n3d.com',
  'http://localhost:5173', // Vite dev (proxy forwards browser Origin)
])
const DEFAULT_ORIGIN = 'https://whoopsie.aks1n3d.com'

function corsHeaders(request) {
  const origin = request?.headers?.get('Origin')
  return {
    'Access-Control-Allow-Origin':
      origin && ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    // Tell caches that the response depends on the Origin header.
    Vary: 'Origin',
  }
}

function json(data, init = {}, request) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
      ...(init.headers || {}),
    },
  })
}

function buildPrompt({ situation, intensity, tone, locale, category }) {
  const language = LOCALE_NAMES[locale]
  const categoryLine =
    category && CATEGORY_CONTEXTS[category]
      ? `\n\nThe recipient: ${CATEGORY_CONTEXTS[category]}. Tune the excuse so it lands naturally for that specific audience — register, references, and what they would or wouldn't believe.`
      : ''
  const system = `You are Whoopsie, a witty excuse generator. You craft plausibly-deniable excuses people can copy-paste into chats.

Respond ONLY in ${language}. Do not mix languages.

Return JSON in this exact shape: { "excuses": ["...", "...", "..."] } — exactly 3 distinct strings.

Each excuse must:
- be 1 to 3 sentences
- be written in the first person ("I…")
- be immediately copy-pasteable as a chat message (no numbering, no quotes, no markdown, no preamble)
- match the requested intensity: ${INTENSITY_INSTRUCTIONS[intensity]}
- match the requested tone: ${TONE_INSTRUCTIONS[tone]}
- be distinct from the other two in mechanism / hook
- feel culturally natural in ${language} (avoid awkward direct translations)${categoryLine}`

  const user = `The user ${SITUATION_LABELS[situation]}. Give me 3 excuses in ${language}.`
  return { system, user }
}

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite']

function geminiBody({ system, user }) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0.95,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          excuses: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['excuses'],
      },
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  }
}

async function callGeminiModel({ apiKey, model, body }) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
    encodeURIComponent(apiKey)
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function callGemini({ apiKey, system, user }) {
  const body = geminiBody({ system, user })
  let lastResp = null
  for (const model of MODELS) {
    const resp = await callGeminiModel({ apiKey, model, body })
    if (resp.ok) return { resp, model }
    lastResp = resp
    if (resp.status !== 503 && resp.status !== 429) break
    console.warn(`Gemini ${model} returned ${resp.status}, falling back`)
  }
  return { resp: lastResp, model: MODELS[MODELS.length - 1] }
}

async function readGeminiExcuses(resp) {
  const data = await resp.json().catch(() => null)
  const candidate = data?.candidates?.[0]
  if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
    return { error: 'blocked', reason: candidate.finishReason }
  }
  const content = candidate?.content?.parts?.[0]?.text
  if (!content) return { error: 'empty_response' }
  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    return { error: 'invalid_model_json' }
  }
  const excuses = Array.isArray(parsed.excuses)
    ? parsed.excuses.filter((s) => typeof s === 'string' && s.trim().length > 0).slice(0, 3)
    : []
  if (excuses.length === 0) return { error: 'no_excuses' }
  return { excuses }
}

async function handleGenerate(request, env) {
  if (!env.GEMINI_API_KEY) return json({ error: 'missing_api_key' }, { status: 500 }, request)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'invalid_json' }, { status: 400 }, request)
  }

  const { situation, intensity, tone, locale, category } = body || {}
  if (
    !SITUATION_LABELS[situation] ||
    !INTENSITY_INSTRUCTIONS[intensity] ||
    !TONE_INSTRUCTIONS[tone] ||
    !LOCALE_NAMES[locale]
  ) {
    return json({ error: 'invalid_params' }, { status: 400 }, request)
  }
  // category is optional — only validate when present
  if (category && category !== 'none' && !CATEGORY_CONTEXTS[category]) {
    return json({ error: 'invalid_category' }, { status: 400 }, request)
  }
  const effectiveCategory = category && category !== 'none' ? category : null

  const { system, user } = buildPrompt({ situation, intensity, tone, locale, category: effectiveCategory })

  let resp, model
  try {
    ;({ resp, model } = await callGemini({ apiKey: env.GEMINI_API_KEY, system, user }))
  } catch (err) {
    console.error('Gemini fetch failed:', err)
    return json({ error: 'upstream_unreachable' }, { status: 502 }, request)
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    console.error(`Gemini non-2xx via ${model}`, resp.status, text.slice(0, 500))
    return json({ error: 'upstream_error', status: resp.status }, { status: 502 }, request)
  }
  const out = await readGeminiExcuses(resp)
  if (out.error) return json(out, { status: 502 }, request)
  return json({ excuses: out.excuses }, {}, request)
}

const SITUATION_KEYS = Object.keys(SITUATION_LABELS)
const TONE_KEYS = Object.keys(TONE_INSTRUCTIONS)

async function handleDaily(request, env) {
  const url = new URL(request.url)
  const locale = url.searchParams.get('locale') || 'en'
  if (!LOCALE_NAMES[locale]) return json({ error: 'invalid_locale' }, { status: 400 }, request)
  if (!env.GEMINI_API_KEY) return json({ error: 'missing_api_key' }, { status: 500 }, request)

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const cacheKey = new Request(`https://whoopsie-cache.local/daily/${today}/${locale}`)
  const cache = caches.default

  // Cache stores the JSON body WITHOUT CORS headers — we re-apply CORS per request
  // so a single cache entry serves prod + dev origins correctly.
  const cached = await cache.match(cacheKey)
  if (cached) {
    const body = await cached.text()
    return new Response(body, {
      headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
    })
  }

  // Deterministic pick by date so the entire planet sees the same combo today.
  const seed = parseInt(today.replace(/-/g, ''), 10)
  const situation = SITUATION_KEYS[seed % SITUATION_KEYS.length]
  const tone = TONE_KEYS[Math.floor(seed / 7) % TONE_KEYS.length]
  const intensity = 'believable'

  const { system, user } = buildPrompt({ situation, intensity, tone, locale, category: null })

  let resp
  try {
    ;({ resp } = await callGemini({ apiKey: env.GEMINI_API_KEY, system, user }))
  } catch {
    return json({ error: 'upstream_unreachable' }, { status: 502 }, request)
  }
  if (!resp.ok) return json({ error: 'upstream_error', status: resp.status }, { status: 502 }, request)

  const out = await readGeminiExcuses(resp)
  if (out.error) return json(out, { status: 502 }, request)

  const body = JSON.stringify({
    excuse: out.excuses[0],
    situation,
    intensity,
    tone,
    date: today,
  })

  // Cacheable copy: no CORS headers, just the body + cache-control.
  const cacheable = new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  })
  await cache.put(cacheKey, cacheable)

  // Served response: add per-request CORS.
  return new Response(body, {
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  })
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) })
    }
    const url = new URL(request.url)
    if (url.pathname === '/api/generate' && request.method === 'POST') {
      return handleGenerate(request, env, ctx)
    }
    if (url.pathname === '/api/daily' && request.method === 'GET') {
      return handleDaily(request, env, ctx)
    }
    return json({ error: 'not_found' }, { status: 404 }, request)
  },
}
