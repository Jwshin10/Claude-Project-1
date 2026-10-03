import { DndContext, DragOverlay } from '@dnd-kit/core'
import { addItem, createGroup } from '../db/actions'
import type { Group, Item } from '../db/types'
import { GroupDropZone, GroupHeader } from './GroupBits'
import { ItemCard } from './ItemViews'
import { QuickAdd } from './QuickAdd'
import { useItemDnd } from './useItemDnd'

interface Props {
  planId: string
  groups: Group[]
  items: Item[]
  totals: Map<string, number>
  onOpen: (id: string) => void
}

export function BoardView({ planId, groups, items, totals, onOpen }: Props) {
  const { columns, itemsById, activeItem, dndProps } = useItemDnd(groups, items)

  return (
    <div className="flex items-start gap-3 overflow-x-auto px-4 pb-6 md:px-12">
      <DndContext {...dndProps}>
        {groups.map((group, index) => {
          const ids = columns[group.id] ?? []
          return (
            <section key={group.id} aria-label={group.name} className="flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-surface-2/60 p-2">
              <div className="px-1 pt-1">
                <GroupHeader group={group} index={index} groupCount={groups.length} itemCount={totals.get(group.id) ?? 0} horizontal />
              </div>
              <GroupDropZone groupId={group.id} itemIds={ids} className="flex min-h-10 flex-col gap-2">
                {ids.map((id) => {
                  const item = itemsById.get(id)
                  return item && <ItemCard key={id} item={item} onOpen={onOpen} />
                })}
              </GroupDropZone>
              <QuickAdd label="Add item" placeholder="Item title, then Enter" onAdd={(title) => addItem(group.id, { title })} />
            </section>
          )
        })}
        <DragOverlay>{activeItem && <ItemCard item={activeItem} onOpen={onOpen} overlay />}</DragOverlay>
      </DndContext>

      <div className="w-72 shrink-0">
        <QuickAdd label="Add group" placeholder="Group name, then Enter" onAdd={(name) => createGroup(planId, name)} className="font-medium" />
      </div>
    </div>
  )
}
