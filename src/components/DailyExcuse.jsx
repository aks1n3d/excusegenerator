import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { fetchDailyExcuse } from '../lib/api'

export default function DailyExcuse({ onShare }) {
  const { t, locale } = useI18n()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetchDailyExcuse(locale)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [locale])

  if (loading || error || !data?.excuse) return null

  return (
    <section className="mb-8 rounded-3xl bg-gradient-to-br from-violet-soft/20 to-coral/20 ring-1 ring-violet-soft/30 p-5 md:p-6 backdrop-blur animate-fade-up">
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-soft">
          <span aria-hidden className="animate-float-y inline-block">🌟</span>
          {t('daily.title')}
        </span>
        <span className="text-xs text-ink-soft tabular-nums">{data.date}</span>
      </div>
      <p className="font-display text-lg md:text-xl leading-snug text-ink">
        {data.excuse}
      </p>
      {onShare && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => onShare(data.excuse, { kind: 'daily', ...data })}
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-soft text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 active:scale-95 transition"
          >
            <span aria-hidden>📤</span>
            {t('daily.shareCta')}
          </button>
        </div>
      )}
    </section>
  )
}
