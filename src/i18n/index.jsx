import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import en from './locales/en'
import de from './locales/de'
import uk from './locales/uk'
import ru from './locales/ru'

export const LOCALES = {
  en: { label: 'English', flag: '🇬🇧', strings: en },
  de: { label: 'Deutsch', flag: '🇩🇪', strings: de },
  uk: { label: 'Українська', flag: '🇺🇦', strings: uk },
  ru: { label: 'Русский', flag: '🇷🇺', strings: ru },
}

const I18nContext = createContext(null)

const STORAGE_KEY = 'whoopsie.locale'

function detectInitialLocale() {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored && LOCALES[stored]) return stored
  const nav = window.navigator.language?.slice(0, 2)
  if (nav && LOCALES[nav]) return nav
  return 'en'
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectInitialLocale)

  const setLocale = useCallback((next) => {
    if (!LOCALES[next]) return
    setLocaleState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }, [])

  const t = useCallback(
    (key) => LOCALES[locale]?.strings[key] ?? LOCALES.en.strings[key] ?? key,
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
