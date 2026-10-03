import { DndContext, DragOverlay } from '@dnd-kit/core'
import { addItem, createGroup } from '../db/actions'
import type { Group, Item } from '../db/types'
import type { GroupCounts } from './counts'
import { tabStyle } from '../lib/tab'
import { GroupDropZone, GroupHeader } from './GroupBits'
import { ItemRow } from './ItemViews'
import { QuickAdd } from './QuickAdd'
import { useItemDnd } from './useItemDnd'

interface Props {
  planId: string
  groups: Group[]
  items: Item[]
  counts: GroupCounts
  onOpen: (id: string) => void
}

export function ListView({ planId, groups, items, counts, onOpen }: Props) {
  const { columns, itemsById, activeItem, dndProps } = useItemDnd(groups, items)

  return (
    <div className="flex flex-col gap-10">
      <DndContext {...dndProps}>
        {groups.map((group, index) => {
          const ids = columns[group.id] ?? []
          const count = counts.get(group.id)
          return (
            <section key={group.id} aria-label={group.name} style={tabStyle(group)}>
              <GroupHeader group={group} index={index} groupCount={groups.length} itemCount={count?.total ?? 0} doneCount={count?.done ?? 0} />
              <div className="margin-rule">
                <GroupDropZone groupId={group.id} itemIds={ids} className="flex min-h-1 flex-col">
                  {ids.map((id) => {
                    const item = itemsById.get(id)
                    return item && <ItemRow key={id} item={item} onOpen={onOpen} />
                  })}
                </GroupDropZone>
                <QuickAdd label="Add an item" placeholder="What needs doing?" onAdd={(title) => addItem(group.id, { title })} />
              </div>
            </section>
          )
        })}
        <DragOverlay>{activeItem && <ItemRow item={activeItem} onOpen={onOpen} overlay />}</DragOverlay>
      </DndContext>

      <QuickAdd variant="tab" label="New group" placeholder="Group name" onAdd={(name) => createGroup(planId, name)} />
    </div>
  )
}
