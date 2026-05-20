// Unified analytics + error-tracking layer.
// Every integration is env-var-gated — if the config is missing, that provider is silently skipped.
// Heavy SDKs are dynamically imported so they don't bloat the initial bundle.
//
// Stack:
//   Firebase Analytics (GA4)  → visitor counts, sessions, retention, custom event funnel
//   Firestore                  → per-excuse copy/share rows for content-level analysis
//   GlitchTip (Sentry-compat)  → error tracking

let initialized = false
let firestoreDb = null
let firebaseAnalytics = null
let firebaseReady = null

export async function initAnalytics() {
  if (initialized) return
  initialized = true

  // 1) GlitchTip / any Sentry-compatible endpoint
  const dsn = import.meta.env.VITE_GLITCHTIP_DSN
  if (dsn) {
    try {
      const Sentry = await import('@sentry/react')
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0,
      })
    } catch (e) {
      console.warn('GlitchTip init failed', e)
    }
  }

  // 2) Firebase (Analytics + Firestore + anonymous auth)
  if (readFirebaseConfig()) {
    firebaseReady = bootFirebase()
  }
}

function readFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  if (!apiKey) return null
  return {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // G-XXXXXXXXXX — required for Analytics
  }
}

async function bootFirebase() {
  try {
    const [
      { initializeApp },
      { getFirestore },
      { getAuth, signInAnonymously },
      { getAnalytics, isSupported },
    ] = await Promise.all([
      import('firebase/app'),
      import('firebase/firestore'),
      import('firebase/auth'),
      import('firebase/analytics'),
    ])
    const config = readFirebaseConfig()
    const app = initializeApp(config)
    firestoreDb = getFirestore(app)

    // Anonymous auth so Firestore rules can require auth without identifying users
    try {
      await signInAnonymously(getAuth(app))
    } catch (e) {
      console.warn('Firebase anon auth failed', e)
    }

    // GA4 via Firebase Analytics — only if measurementId is set AND env supports it
    // (Some envs block analytics: in-app browsers, strict tracking-protection, etc.)
    if (config.measurementId) {
      try {
        if (await isSupported()) {
          firebaseAnalytics = getAnalytics(app)
          // page_view is auto-logged by GA4
        }
      } catch (e) {
        console.warn('Firebase Analytics init skipped', e)
      }
    }
  } catch (e) {
    console.warn('Firebase init failed', e)
  }
}

// GA4 restrictions: param name <=40 chars, value <=100 chars (strings),
// max 25 params per event, nested objects not accepted.
function sanitizeForGA(props) {
  const out = {}
  for (const [k, v] of Object.entries(props || {})) {
    const key = String(k).slice(0, 40)
    if (typeof v === 'string') out[key] = v.slice(0, 100)
    else if (typeof v === 'number' || typeof v === 'boolean') out[key] = v
    // skip objects/arrays
  }
  return out
}

export async function trackEvent(name, props = {}) {
  if (!firebaseReady) return
  await firebaseReady

  // GA4 — for visitor counts + event funnel
  if (firebaseAnalytics) {
    try {
      const { logEvent } = await import('firebase/analytics')
      logEvent(firebaseAnalytics, name, sanitizeForGA(props))
    } catch (e) {
      console.warn('GA4 logEvent failed', e)
    }
  }

  // Firestore — keeps the full payload (including the excuse text itself)
  // so you can later answer "which excuses got copied most?"
  if (firestoreDb) {
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      await addDoc(collection(firestoreDb, 'events'), {
        name,
        props,
        at: serverTimestamp(),
        uiLocale: navigator.language || null,
      })
    } catch (e) {
      console.warn('Firestore write failed', e)
    }
  }
}

export async function captureException(err, context = {}) {
  const dsn = import.meta.env.VITE_GLITCHTIP_DSN
  if (!dsn) return
  try {
    const Sentry = await import('@sentry/react')
    Sentry.captureException(err, { extra: context })
  } catch {}
}
