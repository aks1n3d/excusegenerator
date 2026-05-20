import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import {
  buildShareIntent,
  captureElementToBlob,
  downloadBlob,
  shareCardImage,
} from '../lib/shareCard'
import { trackEvent } from '../lib/analytics'

export default function ShareModal({ open, onClose, excuse, meta }) {
  const { t } = useI18n()
  const cardRef = useRef(null)
  const [busy, setBusy] = useState(null)
  const [done, setDone] = useState(null)

  // Close on Esc
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Reset transient state when reopening
  useEffect(() => {
    if (open) {
      setBusy(null)
      setDone(null)
    }
  }, [open])

  if (!open) return null

  async function captureAndShare(kind) {
    if (!cardRef.current) return
    setBusy(kind)
    try {
      const blob = await captureElementToBlob(cardRef.current)
      if (!blob) throw new Error('capture_failed')
      if (kind === 'native') {
        const r = await shareCardImage({ blob, text: excuse })
        setDone(r.kind)
      } else if (kind === 'download') {
        const r = downloadBlob(blob)
        setDone(r.kind)
      }
      trackEvent('excuse_shared', { method: kind, ...meta })
    } catch (e) {
      setDone('error')
    } finally {
      setBusy(null)
    }
  }

  function openIntent(target) {
    const url = buildShareIntent(target, excuse)
    if (!url) return
    trackEvent('excuse_shared', { method: target, ...meta })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-up"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full md:max-w-md rounded-t-3xl md:rounded-3xl bg-white p-5 md:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-ink">{t('share.title')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full size-8 inline-flex items-center justify-center text-ink-soft hover:bg-blush"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Branded card preview — this is what becomes the PNG */}
        <div className="flex justify-center mb-5">
          <div
            ref={cardRef}
            className="w-[340px] rounded-3xl p-6 text-left"
            style={{
              background:
                'linear-gradient(135deg, #fff8f1 0%, #ffe4ec 50%, #f3e8ff 100%)',
              fontFamily:
                'Fraunces, ui-serif, Georgia, serif',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 20, fontWeight: 600, color: '#2d2a3a' }}>
                Whoopsie <span aria-hidden>🙃</span>
              </span>
              <span style={{ fontSize: 11, color: '#6b6379', letterSpacing: '0.1em' }}>
                WHOOPSIE.APP
              </span>
            </div>
            <p
              style={{
                fontSize: 18,
                lineHeight: 1.35,
                color: '#2d2a3a',
                margin: 0,
              }}
            >
              {excuse}
            </p>
            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1px dashed rgba(45,42,58,0.2)',
                fontSize: 11,
                color: '#6b6379',
                fontStyle: 'italic',
              }}
            >
              an AI-crafted alibi for your next whoopsie ✨
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => captureAndShare('native')}
            disabled={!!busy}
            className="rounded-2xl bg-coral text-white py-3 font-medium text-sm hover:bg-coral-deep disabled:opacity-60 active:scale-95 transition"
          >
            {busy === 'native' ? '…' : `📤 ${t('share.share')}`}
          </button>
          <button
            type="button"
            onClick={() => captureAndShare('download')}
            disabled={!!busy}
            className="rounded-2xl bg-ink text-white py-3 font-medium text-sm hover:opacity-90 disabled:opacity-60 active:scale-95 transition"
          >
            {busy === 'download' ? '…' : `⬇️ ${t('share.download')}`}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => openIntent('twitter')}
            className="rounded-2xl bg-white ring-1 ring-black/10 py-2.5 text-xs font-medium text-ink hover:bg-blush active:scale-95 transition"
          >
            𝕏 / Twitter
          </button>
          <button
            type="button"
            onClick={() => openIntent('telegram')}
            className="rounded-2xl bg-white ring-1 ring-black/10 py-2.5 text-xs font-medium text-ink hover:bg-blush active:scale-95 transition"
          >
            Telegram
          </button>
          <button
            type="button"
            onClick={() => openIntent('whatsapp')}
            className="rounded-2xl bg-white ring-1 ring-black/10 py-2.5 text-xs font-medium text-ink hover:bg-blush active:scale-95 transition"
          >
            WhatsApp
          </button>
        </div>

        {done && done !== 'aborted' && (
          <p className="mt-3 text-center text-xs text-ink-soft">
            {done === 'shared' && '✅ ' + t('share.savedToShare')}
            {done === 'downloaded' && '✅ ' + t('share.fallbackDownload')}
            {done === 'error' && '⚠️ ' + t('error.generic')}
          </p>
        )}

        <p className="mt-3 text-center text-[11px] text-ink-soft">
          {t('share.instagramHint')}
        </p>
      </div>
    </div>
  )
}
