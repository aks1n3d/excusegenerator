import clsx from 'clsx'
import { useI18n } from '../i18n'

export default function OptionPicker({ label, options, value, onChange, columns = 3 }) {
  const { t } = useI18n()
  return (
    <section>
      <h2 className="font-display text-xl md:text-2xl mb-3 text-ink">{label}</h2>
      <div
        className={clsx(
          'grid gap-2.5',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'grid-cols-2 sm:grid-cols-3',
        )}
      >
        {options.map((opt) => {
          const selected = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              aria-pressed={selected}
              className={clsx(
                'group flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-4 transition-all duration-200 shadow-sm ring-1',
                selected
                  ? 'bg-coral text-white ring-coral-deep shadow-coral/30 scale-[1.03]'
                  : 'bg-white/80 text-ink ring-black/5 hover:bg-white hover:-translate-y-0.5 hover:shadow-md',
              )}
            >
              <span
                key={selected ? 'on' : 'off'}
                className={clsx(
                  'text-2xl md:text-3xl inline-block transition-transform',
                  selected ? 'animate-pop' : 'group-hover:animate-wiggle-strong',
                )}
                aria-hidden
              >
                {opt.emoji}
              </span>
              <span className="text-sm md:text-base font-medium leading-tight text-center">
                {t(opt.labelKey)}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
