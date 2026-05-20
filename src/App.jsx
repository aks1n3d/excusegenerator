import { useState } from 'react'
import Header from './components/Header'
import OptionPicker from './components/OptionPicker'
import CategoryPicker from './components/CategoryPicker'
import ExcuseCard from './components/ExcuseCard'
import DailyExcuse from './components/DailyExcuse'
import ShareModal from './components/ShareModal'
import FavoritesDrawer from './components/FavoritesDrawer'
import { SITUATIONS, INTENSITIES, TONES } from './data/options'
import { useI18n } from './i18n'
import { generateExcuses, ExcuseError } from './lib/api'
import { useFavorites } from './hooks/useFavorites'
import { trackEvent } from './lib/analytics'

export default function App() {
  const { t, locale } = useI18n()
  const [situation, setSituation] = useState(SITUATIONS[0].id)
  const [intensity, setIntensity] = useState(INTENSITIES[1].id)
  const [tone, setTone] = useState(TONES[0].id)
  const [category, setCategory] = useState('none')
  const [excuses, setExcuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { favorites, toggle, remove, isFavorite } = useFavorites()

  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [share, setShare] = useState(null) // { excuse, meta } | null

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const result = await generateExcuses({ situation, intensity, tone, locale, category })
      setExcuses(result)
      trackEvent('excuse_generated', {
        situation,
        intensity,
        tone,
        category,
        locale,
        count: result.length,
      })
    } catch (err) {
      const code = err instanceof ExcuseError ? err.code : 'generic'
      setError(code === 'network' ? 'network' : 'generic')
    } finally {
      setLoading(false)
    }
  }

  function openShare(excuse, meta) {
    setShare({ excuse, meta })
  }

  const hasResults = excuses.length > 0
  const meta = { situation, intensity, tone, category, locale }

  return (
    <div className="min-h-full flex flex-col">
      <Header favoritesCount={favorites.length} onOpenFavorites={() => setFavoritesOpen(true)} />

      <main className="flex-1 px-5 md:px-10 pb-16 max-w-3xl mx-auto w-full">
        <section className="text-center pt-4 pb-6 md:pt-8 md:pb-8">
          <h1
            className="font-display text-4xl md:text-6xl text-ink leading-tight animate-fade-up"
            style={{ animationDelay: '0ms' }}
          >
            {t('app.tagline')}
          </h1>
          <p
            className="mt-3 text-base md:text-lg text-ink-soft max-w-xl mx-auto animate-fade-up"
            style={{ animationDelay: '120ms' }}
          >
            {t('app.subtitle')}
          </p>
        </section>

        <DailyExcuse onShare={openShare} />

        <div className="space-y-7">
          <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
            <OptionPicker
              label={t('section.situation')}
              options={SITUATIONS}
              value={situation}
              onChange={setSituation}
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '320ms' }}>
            <OptionPicker
              label={t('section.intensity')}
              options={INTENSITIES}
              value={intensity}
              onChange={setIntensity}
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '400ms' }}>
            <OptionPicker
              label={t('section.tone')}
              options={TONES}
              value={tone}
              onChange={setTone}
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '470ms' }}>
            <CategoryPicker value={category} onChange={setCategory} />
          </div>
        </div>

        <div className="mt-8 flex justify-center animate-fade-up" style={{ animationDelay: '560ms' }}>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className={
              'inline-flex items-center gap-2 rounded-full bg-coral hover:bg-coral-deep disabled:opacity-80 text-white font-semibold px-7 py-3.5 text-lg shadow-lg shadow-coral/30 transition active:scale-[0.98] hover:scale-[1.02] ' +
              (!hasResults && !loading ? 'animate-pulse-glow' : '')
            }
          >
            {loading ? (
              <>
                <span aria-hidden className="inline-block animate-wiggle-soft">🍳</span>
                <span>{t('cta.generating')}</span>
                <span className="inline-flex items-end gap-0.5 ml-0.5 pb-1">
                  <span className="size-1.5 rounded-full bg-white animate-cook-dot" style={{ animationDelay: '0ms' }} />
                  <span className="size-1.5 rounded-full bg-white animate-cook-dot" style={{ animationDelay: '150ms' }} />
                  <span className="size-1.5 rounded-full bg-white animate-cook-dot" style={{ animationDelay: '300ms' }} />
                </span>
              </>
            ) : (
              <>
                <span aria-hidden className="inline-block">✨</span>
                {hasResults ? t('cta.regenerate') : t('cta.generate')}
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-white/80 ring-1 ring-coral-deep/30 px-5 py-3 text-center text-ink animate-fade-up">
            <span aria-hidden className="mr-1">😬</span>
            {t(error === 'network' ? 'error.network' : 'error.generic')}
          </div>
        )}

        {hasResults && (
          <section key={excuses.join('|')} className="mt-10 space-y-4">
            {excuses.map((e, i) => (
              <div
                key={`${i}-${e.slice(0, 12)}`}
                className="animate-pop-in"
                style={{ animationDelay: `${i * 110}ms` }}
              >
                <ExcuseCard
                  excuse={e}
                  index={i}
                  meta={meta}
                  isFavorite={isFavorite(e)}
                  onToggleFavorite={toggle}
                  onShare={openShare}
                />
              </div>
            ))}
          </section>
        )}
      </main>

      <footer className="py-6 text-center text-sm text-ink-soft">
        {t('footer.madeWith')} ☕
      </footer>

      <ShareModal
        open={!!share}
        onClose={() => setShare(null)}
        excuse={share?.excuse || ''}
        meta={share?.meta || {}}
      />

      <FavoritesDrawer
        open={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
        favorites={favorites}
        onRemove={remove}
        onShare={(excuse, meta) => {
          setFavoritesOpen(false)
          openShare(excuse, meta)
        }}
      />
    </div>
  )
}
