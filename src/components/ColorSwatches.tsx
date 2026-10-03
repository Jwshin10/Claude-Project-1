import { Check } from 'lucide-react'
import { COLOR_LABEL, COLOR_NAMES, colorVar, type ColorName } from '../db/types'

export function ColorSwatches({ value, onChange }: { value: ColorName; onChange: (color: ColorName) => void }) {
  return (
    <div role="radiogroup" aria-label="Color" className="flex gap-[7px] px-2.5 pt-1 pb-2">
      {COLOR_NAMES.map((name) => (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={value === name}
          aria-label={COLOR_LABEL[name]}
          title={COLOR_LABEL[name]}
          onClick={() => onChange(name)}
          className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: colorVar(name) }}
        >
          {value === name && <Check size={13} strokeWidth={3.2} />}
        </button>
      ))}
    </div>
  )
}
