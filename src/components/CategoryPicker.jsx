import clsx from 'clsx'
import { CATEGORIES } from '../data/categories'
import { useI18n } from '../i18n'

export default function CategoryPicker({ value, onChange }) {
  const { t } = useI18n()
  return (
    <section>
      <h2 className="font-display text-xl md:text-2xl mb-3 text-ink">
        {t('section.category')}
      </h2>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const selected = value === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              aria-pressed={selected}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-all duration-200',
                selected
                  ? 'bg-violet-soft text-white ring-violet-soft shadow-sm scale-[1.04]'
                  : 'bg-white/80 text-ink ring-black/5 hover:bg-white hover:-translate-y-0.5',
              )}
            >
              <span aria-hidden>{c.emoji}</span>
              <span>{t(c.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
