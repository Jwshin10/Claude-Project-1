import { DndContext, DragOverlay } from '@dnd-kit/core'
import { addItem, createGroup } from '../db/actions'
import type { Group, Item } from '../db/types'
import { GroupDropZone, GroupHeader } from './GroupBits'
import { ItemRow } from './ItemViews'
import { QuickAdd } from './QuickAdd'
import { useItemDnd } from './useItemDnd'

interface Props {
  planId: string
  groups: Group[]
  items: Item[]
  totals: Map<string, number>
  onOpen: (id: string) => void
}

export function ListView({ planId, groups, items, totals, onOpen }: Props) {
  const { columns, itemsById, activeItem, dndProps } = useItemDnd(groups, items)

  return (
    <div className="flex flex-col gap-8">
      <DndContext {...dndProps}>
        {groups.map((group, index) => {
          const ids = columns[group.id] ?? []
          return (
            <section key={group.id} className="flex flex-col gap-1" aria-label={group.name}>
              <div className="border-b border-border pb-1.5">
                <GroupHeader group={group} index={index} groupCount={groups.length} itemCount={totals.get(group.id) ?? 0} />
              </div>
              <GroupDropZone groupId={group.id} itemIds={ids} className="flex min-h-2 flex-col">
                {ids.map((id) => {
                  const item = itemsById.get(id)
                  return item && <ItemRow key={id} item={item} onOpen={onOpen} />
                })}
              </GroupDropZone>
              <QuickAdd label="Add item" placeholder="Item title, then Enter" onAdd={(title) => addItem(group.id, { title })} />
            </section>
          )
        })}
        <DragOverlay>{activeItem && <ItemRow item={activeItem} onOpen={onOpen} overlay />}</DragOverlay>
      </DndContext>

      <QuickAdd label="Add group" placeholder="Group name, then Enter" onAdd={(name) => createGroup(planId, name)} className="font-medium" />
    </div>
  )
}
