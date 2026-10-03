import { DndContext, DragOverlay } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { addItem, createGroup } from '../db/actions'
import type { Group, Item } from '../db/types'
import type { GroupCounts } from './counts'
import { GroupDragPreview, GroupDropZone, GroupHeader, SortableGroup } from './GroupBits'
import { ItemCard } from './ItemViews'
import { QuickAdd } from './QuickAdd'
import { usePlanDnd } from './usePlanDnd'

interface Props {
  planId: string
  groups: Group[]
  items: Item[]
  counts: GroupCounts
  onOpen: (id: string) => void
}

export function BoardView({ planId, groups: storedGroups, items, counts, onOpen }: Props) {
  const { groups, groupSortIds, columns, itemsById, activeItem, activeGroup, dndProps } = usePlanDnd(storedGroups, items)

  return (
    <div className="flex items-start gap-5 overflow-x-auto px-4 pt-1 pb-8 md:px-14">
      <DndContext {...dndProps}>
        <SortableContext items={groupSortIds} strategy={horizontalListSortingStrategy}>
          {groups.map((group, index) => {
            const ids = columns[group.id] ?? []
            const count = counts.get(group.id)
            return (
              <SortableGroup key={group.id} group={group} className="flex w-[17.5rem] shrink-0 flex-col gap-3">
                {(grip) => (
                  <>
                    <GroupHeader
                      group={group}
                      index={index}
                      groupCount={groups.length}
                      itemCount={count?.total ?? 0}
                      doneCount={count?.done ?? 0}
                      horizontal
                      grip={grip}
                    />
                    <GroupDropZone groupId={group.id} itemIds={ids} className="flex min-h-12 flex-col gap-2.5 rounded-md">
                      {ids.map((id) => {
                        const item = itemsById.get(id)
                        return item && <ItemCard key={id} item={item} onOpen={onOpen} />
                      })}
                    </GroupDropZone>
                    <QuickAdd variant="card" label="Add an item" placeholder="What needs doing?" onAdd={(title) => addItem(group.id, { title })} />
                  </>
                )}
              </SortableGroup>
            )
          })}
        </SortableContext>
        <DragOverlay>
          {activeItem && <ItemCard item={activeItem} onOpen={onOpen} overlay />}
          {activeGroup && <GroupDragPreview group={activeGroup} itemCount={counts.get(activeGroup.id)?.total ?? 0} />}
        </DragOverlay>
      </DndContext>

      <div className="w-[17.5rem] shrink-0">
        <QuickAdd variant="tab" label="New group" placeholder="Group name" onAdd={(name) => createGroup(planId, name)} />
      </div>
    </div>
  )
}
