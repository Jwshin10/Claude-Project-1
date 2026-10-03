import { DndContext, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { addItem, createGroup } from '../db/actions'
import type { Group, Item } from '../db/types'
import type { GroupCounts } from './counts'
import { GroupDragPreview, GroupDropZone, GroupHeader, SortableGroup } from './GroupBits'
import { ItemRow } from './ItemViews'
import { QuickAdd } from './QuickAdd'
import { usePlanDnd } from './usePlanDnd'

interface Props {
  planId: string
  groups: Group[]
  items: Item[]
  counts: GroupCounts
  onOpen: (id: string) => void
}

export function ListView({ planId, groups: storedGroups, items, counts, onOpen }: Props) {
  const { groups, groupSortIds, columns, itemsById, activeItem, activeGroup, dndProps } = usePlanDnd(storedGroups, items)
  const colorOf = (item: Item) => storedGroups.find((g) => g.id === item.groupId)?.color ?? 'blue'

  return (
    <div className="flex flex-col gap-9">
      <DndContext {...dndProps}>
        <SortableContext items={groupSortIds} strategy={verticalListSortingStrategy}>
          {groups.map((group, index) => {
            const ids = columns[group.id] ?? []
            return (
              <SortableGroup key={group.id} group={group}>
                {(grip) => (
                  <>
                    <GroupHeader group={group} index={index} groupCount={groups.length} itemCount={counts.get(group.id)?.total ?? 0} grip={grip} />
                    <GroupDropZone groupId={group.id} itemIds={ids} className="flex min-h-1 flex-col">
                      {ids.map((id) => {
                        const item = itemsById.get(id)
                        return item && <ItemRow key={id} item={item} color={group.color} onOpen={onOpen} />
                      })}
                      {/* Inside the drop zone, so an empty group is still easy to drop into. */}
                      <QuickAdd label="New Item" placeholder="New Item" onAdd={(title) => addItem(group.id, { title })} />
                    </GroupDropZone>
                  </>
                )}
              </SortableGroup>
            )
          })}
        </SortableContext>
        <DragOverlay>
          {activeItem && <ItemRow item={activeItem} color={colorOf(activeItem)} onOpen={onOpen} overlay />}
          {activeGroup && <GroupDragPreview group={activeGroup} itemCount={counts.get(activeGroup.id)?.total ?? 0} />}
        </DragOverlay>
      </DndContext>

      <div>
        <QuickAdd variant="button" label="Add Group" placeholder="Group Name" onAdd={(name) => createGroup(planId, name)} />
      </div>
    </div>
  )
}
