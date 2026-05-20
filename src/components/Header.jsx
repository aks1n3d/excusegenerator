import { LOCALES, useI18n } from '../i18n'

export default function Header({ favoritesCount = 0, onOpenFavorites }) {
  const { locale, setLocale, t } = useI18n()

  return (
    <header className="flex items-center justify-between px-5 py-4 md:px-10 md:py-5 gap-3">
      <div className="group flex items-baseline gap-2 cursor-default select-none">
        <span className="text-3xl md:text-4xl font-display font-semibold text-ink">
          Whoopsie
        </span>
        <span className="text-2xl inline-block animate-wiggle-soft group-hover:[animation:wiggle-strong_0.6s_ease-in-out_1]">
          🙃
        </span>
      </div>
      <div className="flex items-center gap-2">
        {onOpenFavorites && (
          <button
            type="button"
            onClick={onOpenFavorites}
            aria-label={t('favorites.open')}
            className="relative inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur px-3 py-1.5 text-sm font-medium text-ink shadow-sm ring-1 ring-black/5 hover:bg-white transition active:scale-95"
          >
            <span aria-hidden>💖</span>
            {favoritesCount > 0 && (
              <span className="text-coral-deep tabular-nums">{favoritesCount}</span>
            )}
          </button>
        )}
        <div className="flex items-center gap-1 rounded-full bg-white/70 backdrop-blur px-1 py-1 shadow-sm ring-1 ring-black/5">
          {Object.entries(LOCALES).map(([code, { flag, label }]) => (
            <button
              key={code}
              onClick={() => setLocale(code)}
              title={label}
              aria-label={label}
              aria-pressed={locale === code}
              className={
                'px-2.5 py-1 rounded-full text-base transition ' +
                (locale === code
                  ? 'bg-coral text-white shadow-sm'
                  : 'hover:bg-blush/60 text-ink-soft')
              }
            >
              <span aria-hidden>{flag}</span>
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
