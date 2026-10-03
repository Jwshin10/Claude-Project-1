import { DndContext, DragOverlay } from '@dnd-kit/core'
import { addItem, createGroup } from '../db/actions'
import type { Group, Item } from '../db/types'
import type { GroupCounts } from './counts'
import { tabStyle } from '../lib/tab'
import { GroupDropZone, GroupHeader } from './GroupBits'
import { ItemCard } from './ItemViews'
import { QuickAdd } from './QuickAdd'
import { useItemDnd } from './useItemDnd'

interface Props {
  planId: string
  groups: Group[]
  items: Item[]
  counts: GroupCounts
  onOpen: (id: string) => void
}

export function BoardView({ planId, groups, items, counts, onOpen }: Props) {
  const { columns, itemsById, activeItem, dndProps } = useItemDnd(groups, items)

  return (
    <div className="flex items-start gap-5 overflow-x-auto px-4 pt-1 pb-8 md:px-14">
      <DndContext {...dndProps}>
        {groups.map((group, index) => {
          const ids = columns[group.id] ?? []
          const count = counts.get(group.id)
          return (
            <section key={group.id} aria-label={group.name} style={tabStyle(group)} className="flex w-[17.5rem] shrink-0 flex-col gap-3">
              <GroupHeader
                group={group}
                index={index}
                groupCount={groups.length}
                itemCount={count?.total ?? 0}
                doneCount={count?.done ?? 0}
                horizontal
              />
              <GroupDropZone groupId={group.id} itemIds={ids} className="flex min-h-12 flex-col gap-2.5 rounded-md">
                {ids.map((id) => {
                  const item = itemsById.get(id)
                  return item && <ItemCard key={id} item={item} onOpen={onOpen} />
                })}
              </GroupDropZone>
              <QuickAdd variant="card" label="Add an item" placeholder="What needs doing?" onAdd={(title) => addItem(group.id, { title })} />
            </section>
          )
        })}
        <DragOverlay>{activeItem && <ItemCard item={activeItem} onOpen={onOpen} overlay />}</DragOverlay>
      </DndContext>

      <div className="w-[17.5rem] shrink-0">
        <QuickAdd variant="tab" label="New group" placeholder="Group name" onAdd={(name) => createGroup(planId, name)} />
      </div>
    </div>
  )
}
