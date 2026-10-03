import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties, KeyboardEvent } from 'react'
import { colorVar, type ColorName, type Item } from '../db/types'
import { cn } from '../lib/cn'
import { ItemDetails, PriorityMark, StatusCircle } from './ItemBits'

interface Props {
  item: Item
  color: ColorName
  onOpen: (id: string) => void
  /** Rendered inside the DragOverlay: not sortable, lifted off the page. */
  overlay?: boolean
}

function useSortableItem(id: string, disabled: boolean) {
  const sortable = useSortable({ id, disabled, data: { type: 'item' } })
  const style: CSSProperties = { transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }
  return { ...sortable, style }
}

// The title is a real button so keyboard users can open the item; its keys are
// kept from the row, where Space/Enter start a keyboard drag instead.
function Title({ item, color, onOpen, className }: Omit<Props, 'overlay'> & { className?: string }) {
  const done = item.status === 'done'
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(item.id)
      }}
      onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
      className={cn('min-w-0 text-left break-words', done && 'text-label-2', className)}
    >
      {!done && <PriorityMark priority={item.priority} color={colorVar(color)} />}
      {item.title}
    </button>
  )
}

/** A Reminders row: the circle, then the title and its details over an inset separator. */
export function ItemRow({ item, color, onOpen, overlay = false }: Props) {
  const { setNodeRef, attributes, listeners, style, isDragging } = useSortableItem(item.id, overlay)
  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={() => onOpen(item.id)}
      className={cn(
        'group/row flex cursor-default touch-manipulation items-start gap-3 rounded-[10px] pl-1',
        isDragging && 'opacity-0',
        overlay && 'cursor-grabbing bg-elevated shadow-float',
      )}
    >
      <div className="flex h-[44px] items-center">
        <StatusCircle item={item} color={colorVar(color)} />
      </div>
      <div className={cn('flex min-h-[44px] min-w-0 flex-1 flex-col justify-center gap-0.5 py-2.5 pr-2', !overlay && 'border-b border-separator')}>
        <Title item={item} color={color} onOpen={onOpen} className="text-body" />
        <ItemDetails item={item} />
      </div>
    </div>
  )
}

/** A card in the board view. */
export function ItemCard({ item, color, onOpen, overlay = false }: Props) {
  const { setNodeRef, attributes, listeners, style, isDragging } = useSortableItem(item.id, overlay)
  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={() => onOpen(item.id)}
      className={cn(
        'flex cursor-default touch-manipulation items-start gap-2.5 rounded-[12px] bg-elevated p-3 shadow-card transition-shadow hover:shadow-[var(--shadow-card),0_4px_14px_-6px_rgba(0,0,0,0.12)]',
        isDragging && 'opacity-0',
        overlay && 'scale-[1.02] cursor-grabbing shadow-float',
      )}
    >
      <div className="pt-px">
        <StatusCircle item={item} color={colorVar(color)} size={20} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Title item={item} color={color} onOpen={onOpen} className="text-callout leading-[1.3]" />
        <ItemDetails item={item} className="text-footnote" />
      </div>
    </div>
  )
}
