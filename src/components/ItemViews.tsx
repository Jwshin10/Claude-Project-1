import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties, KeyboardEvent } from 'react'
import type { Item } from '../db/types'
import { cn } from '../lib/cn'
import { ItemMeta, StatusCheckbox } from './ItemBits'

interface Props {
  item: Item
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
function TitleButton({ item, onOpen, className }: Props & { className?: string }) {
  const done = item.status === 'done'
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(item.id)
      }}
      onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
      className={cn('min-w-0 text-left break-words', className)}
    >
      <span className={cn(done ? 'struck text-ink-3' : 'unstruck')}>{item.title}</span>
    </button>
  )
}

export function ItemRow({ item, onOpen, overlay = false }: Props) {
  const { setNodeRef, attributes, listeners, style, isDragging } = useSortableItem(item.id, overlay)
  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={() => onOpen(item.id)}
      className={cn(
        'grid min-h-11 cursor-pointer touch-manipulation grid-cols-[2.5rem_1fr] items-start border-b border-rule hover:bg-hover',
        isDragging && 'opacity-25',
        overlay && 'cursor-grabbing rounded-md border-transparent bg-card shadow-paper',
      )}
    >
      <div className="flex justify-center pt-[13px]">
        <StatusCheckbox item={item} />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 py-2.5 pr-2 pl-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <TitleButton item={item} onOpen={onOpen} className="text-[15px] leading-6" />
        <ItemMeta item={item} className="shrink-0 sm:justify-end" />
      </div>
    </div>
  )
}

export function ItemCard({ item, onOpen, overlay = false }: Props) {
  const { setNodeRef, attributes, listeners, style, isDragging } = useSortableItem(item.id, overlay)
  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={() => onOpen(item.id)}
      className={cn(
        'flex cursor-pointer touch-manipulation flex-col gap-2 rounded-md border border-rule-strong bg-card px-3 py-2.5 shadow-paper transition-colors hover:border-ink-3',
        isDragging && 'opacity-25',
        overlay && '-rotate-1 cursor-grabbing',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="pt-[3px]">
          <StatusCheckbox item={item} size={16} />
        </div>
        <TitleButton item={item} onOpen={onOpen} className="flex-1 text-[14.5px] leading-[1.4]" />
      </div>
      <ItemMeta item={item} className="pl-[26px] text-[12.5px]" />
    </div>
  )
}
