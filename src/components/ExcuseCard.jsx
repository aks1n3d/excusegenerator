import { useState } from 'react'
import clsx from 'clsx'
import { useI18n } from '../i18n'
import { trackEvent } from '../lib/analytics'

export default function ExcuseCard({ excuse, index, meta, isFavorite, onToggleFavorite, onShare }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(excuse)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      trackEvent('excuse_copied', { index, excuse, ...meta })
    } catch {}
  }

  function handleFavorite() {
    onToggleFavorite?.(excuse, { ...meta, index })
    if (!isFavorite) trackEvent('excuse_favorited', { index, ...meta })
  }

  function handleShare() {
    onShare?.(excuse, { ...meta, index })
  }

  return (
    <article className="relative rounded-3xl bg-white/85 backdrop-blur p-5 md:p-6 shadow-md ring-1 ring-black/5 hover:shadow-xl hover:-translate-y-0.5 transition">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="font-display text-coral-deep text-lg">
          Whoopsie #{index + 1}
        </span>
        <button
          type="button"
          onClick={handleFavorite}
          aria-label={isFavorite ? t('action.unfavorite') : t('action.favorite')}
          aria-pressed={!!isFavorite}
          className={clsx(
            'text-xl inline-block transition active:scale-90',
            isFavorite ? 'animate-pop' : 'opacity-60 hover:opacity-100',
          )}
        >
          {isFavorite ? '💖' : '🤍'}
        </button>
      </div>
      <p className="font-display text-lg md:text-xl leading-snug text-ink">
        {excuse}
      </p>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink text-white px-4 py-2 text-sm font-medium hover:bg-coral-deep active:scale-95 transition"
        >
          <span
            key={copied ? 'yes' : 'no'}
            className={clsx('inline-block', copied && 'animate-pop')}
            aria-hidden
          >
            {copied ? '✅' : '📋'}
          </span>
          {copied ? t('action.copied') : t('action.copy')}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-full bg-coral text-white px-4 py-2 text-sm font-medium hover:bg-coral-deep active:scale-95 transition"
        >
          <span aria-hidden>📤</span>
          {t('action.share')}
        </button>
      </div>
    </article>
  )
}
