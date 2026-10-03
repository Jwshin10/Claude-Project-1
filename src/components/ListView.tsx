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

  return (
    <div className="flex flex-col gap-10">
      <DndContext {...dndProps}>
        <SortableContext items={groupSortIds} strategy={verticalListSortingStrategy}>
          {groups.map((group, index) => {
            const ids = columns[group.id] ?? []
            const count = counts.get(group.id)
            return (
              <SortableGroup key={group.id} group={group}>
                {(grip) => (
                  <>
                    <GroupHeader
                      group={group}
                      index={index}
                      groupCount={groups.length}
                      itemCount={count?.total ?? 0}
                      doneCount={count?.done ?? 0}
                      grip={grip}
                    />
                    <div className="margin-rule">
                      <GroupDropZone groupId={group.id} itemIds={ids} className="flex min-h-1 flex-col">
                        {ids.map((id) => {
                          const item = itemsById.get(id)
                          return item && <ItemRow key={id} item={item} onOpen={onOpen} />
                        })}
                      </GroupDropZone>
                      <QuickAdd label="Add an item" placeholder="What needs doing?" onAdd={(title) => addItem(group.id, { title })} />
                    </div>
                  </>
                )}
              </SortableGroup>
            )
          })}
        </SortableContext>
        <DragOverlay>
          {activeItem && <ItemRow item={activeItem} onOpen={onOpen} overlay />}
          {activeGroup && <GroupDragPreview group={activeGroup} itemCount={counts.get(activeGroup.id)?.total ?? 0} />}
        </DragOverlay>
      </DndContext>

      <QuickAdd variant="tab" label="New group" placeholder="Group name" onAdd={(name) => createGroup(planId, name)} />
    </div>
  )
}
