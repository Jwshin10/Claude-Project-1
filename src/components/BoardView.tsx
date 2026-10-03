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
  const colorOf = (item: Item) => storedGroups.find((g) => g.id === item.groupId)?.color ?? 'blue'

  return (
    <div className="flex items-start gap-4 overflow-x-auto px-4 pb-10 md:px-10">
      <DndContext {...dndProps}>
        <SortableContext items={groupSortIds} strategy={horizontalListSortingStrategy}>
          {groups.map((group, index) => {
            const ids = columns[group.id] ?? []
            return (
              <SortableGroup key={group.id} group={group} className="flex w-[17.5rem] shrink-0 flex-col gap-2">
                {(grip) => (
                  <>
                    <GroupHeader group={group} index={index} groupCount={groups.length} itemCount={counts.get(group.id)?.total ?? 0} board grip={grip} />
                    <GroupDropZone groupId={group.id} itemIds={ids} className="flex min-h-12 flex-col gap-2">
                      {ids.map((id) => {
                        const item = itemsById.get(id)
                        return item && <ItemCard key={id} item={item} color={group.color} onOpen={onOpen} />
                      })}
                    </GroupDropZone>
                    <QuickAdd variant="card" label="New Item" placeholder="New Item" onAdd={(title) => addItem(group.id, { title })} />
                  </>
                )}
              </SortableGroup>
            )
          })}
        </SortableContext>
        <DragOverlay>
          {activeItem && <ItemCard item={activeItem} color={colorOf(activeItem)} onOpen={onOpen} overlay />}
          {activeGroup && <GroupDragPreview group={activeGroup} itemCount={counts.get(activeGroup.id)?.total ?? 0} />}
        </DragOverlay>
      </DndContext>

      <div className="w-[17.5rem] shrink-0 pt-0.5">
        <QuickAdd variant="button" label="Add Group" placeholder="Group Name" onAdd={(name) => createGroup(planId, name)} />
      </div>
    </div>
  )
}
