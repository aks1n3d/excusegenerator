import { useEffect } from 'react'
import { useI18n } from '../i18n'

export default function FavoritesDrawer({ open, onClose, favorites, onRemove, onShare }) {
  const { t } = useI18n()

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-up"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full md:max-w-lg max-h-[80vh] rounded-t-3xl md:rounded-3xl bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-black/5">
          <h3 className="font-display text-xl text-ink inline-flex items-center gap-2">
            <span aria-hidden>💖</span> {t('favorites.title')}
            <span className="text-sm text-ink-soft font-sans">({favorites.length})</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full size-8 inline-flex items-center justify-center text-ink-soft hover:bg-blush"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-3">
          {favorites.length === 0 ? (
            <p className="text-center text-ink-soft py-12">
              <span aria-hidden className="block text-4xl mb-3">🫶</span>
              {t('favorites.empty')}
            </p>
          ) : (
            favorites.map((f) => (
              <article
                key={f.id}
                className="rounded-2xl bg-cream ring-1 ring-black/5 p-4 animate-pop-in"
              >
                <p className="font-display text-base text-ink leading-snug">
                  {f.excuse}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(f.excuse)
                      } catch {}
                    }}
                    className="text-xs rounded-full bg-ink text-white px-3 py-1.5 hover:bg-coral-deep transition"
                  >
                    📋 {t('action.copy')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onShare(f.excuse, f.meta || {})}
                    className="text-xs rounded-full bg-coral text-white px-3 py-1.5 hover:bg-coral-deep transition"
                  >
                    📤 {t('action.share')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(f.id)}
                    className="ml-auto text-xs rounded-full bg-white text-ink-soft px-3 py-1.5 ring-1 ring-black/10 hover:text-coral-deep hover:ring-coral-deep/40 transition"
                    aria-label={t('favorites.remove')}
                  >
                    🗑
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
