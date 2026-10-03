import {
  closestCenter,
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'
import { moveGroup, moveItem } from '../db/actions'
import type { Group, Item } from '../db/types'

/** groupId -> ordered item ids */
export type Columns = Record<string, string[]>

// A group's id is already used by the droppable that holds its items, so the
// group itself is sorted under a prefixed id.
const GROUP_PREFIX = 'group:'
export const groupSortId = (groupId: string) => GROUP_PREFIX + groupId
const isGroupDrag = (id: UniqueIdentifier) => String(id).startsWith(GROUP_PREFIX)
const groupIdOf = (id: UniqueIdentifier) => String(id).slice(GROUP_PREFIX.length)

function buildColumns(groups: Group[], items: Item[]): Columns {
  const columns: Columns = Object.fromEntries(groups.map((g) => [g.id, []]))
  for (const item of [...items].sort((a, b) => a.position - b.position)) {
    columns[item.groupId]?.push(item.id)
  }
  return columns
}

function findGroup(id: UniqueIdentifier, columns: Columns): string | undefined {
  const key = String(id)
  return key in columns ? key : Object.keys(columns).find((g) => columns[g].includes(key))
}

// Groups only land among groups; items only among items and group drop zones.
const collisionDetection: CollisionDetection = (args) => {
  const draggingGroup = isGroupDrag(args.active.id)
  const droppableContainers = args.droppableContainers.filter((c) => (c.data.current?.type === 'group') === draggingGroup)
  return (draggingGroup ? closestCenter : closestCorners)({ ...args, droppableContainers })
}

/**
 * Drag-and-drop shared by the list and board views: items move within and
 * between groups, and whole groups can be reordered.
 *
 * While dragging (and right after dropping, until the database reports the
 * change) we render from local overrides so nothing snaps back. Each override
 * is tied to the query result it was based on, so it is dropped automatically
 * as soon as a fresh result arrives.
 */
export function usePlanDnd(groups: Group[], items: Item[]) {
  const built = useMemo(() => buildColumns(groups, items), [groups, items])
  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const [override, setOverride] = useState<{ basis: Item[]; columns: Columns } | null>(null)
  const [groupOverride, setGroupOverride] = useState<{ basis: Group[]; order: string[] } | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const columns = override?.basis === items ? override.columns : built
  const orderedGroups = useMemo(() => {
    if (groupOverride?.basis !== groups) return groups
    const byId = new Map(groups.map((g) => [g.id, g]))
    return groupOverride.order.flatMap((id) => byId.get(id) ?? [])
  }, [groups, groupOverride])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Long-press on touch screens, so normal swipes still scroll the page.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
    if (!isGroupDrag(active.id)) setOverride({ basis: items, columns })
  }

  // Moving an item between groups happens during the drag, so the target group opens a gap.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || isGroupDrag(active.id)) return
    const from = findGroup(active.id, columns)
    const to = findGroup(over.id, columns)
    if (!from || !to || from === to) return

    const target = columns[to]
    const overIndex = target.indexOf(String(over.id))
    const translated = active.rect.current.translated
    const below = translated != null && translated.top > over.rect.top + over.rect.height / 2
    const index = overIndex === -1 ? target.length : overIndex + (below ? 1 : 0)

    setOverride({
      basis: items,
      columns: {
        ...columns,
        [from]: columns[from].filter((id) => id !== active.id),
        [to]: [...target.slice(0, index), String(active.id), ...target.slice(index)],
      },
    })
  }

  const onGroupDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || over.id === active.id) return
    const ids = orderedGroups.map((g) => g.id)
    const from = ids.indexOf(groupIdOf(active.id))
    const to = ids.indexOf(groupIdOf(over.id))
    if (from === -1 || to === -1) return
    setGroupOverride({ basis: groups, order: arrayMove(ids, from, to) })
    void moveGroup(ids[from], to)
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (isGroupDrag(active.id)) {
      onGroupDragEnd(event)
      return
    }
    const groupId = findGroup(active.id, columns)
    if (!over || !groupId) {
      setOverride(null)
      return
    }
    let list = columns[groupId]
    const overIndex = list.indexOf(String(over.id))
    if (overIndex !== -1 && over.id !== active.id) {
      list = arrayMove(list, list.indexOf(String(active.id)), overIndex)
    }
    setOverride({ basis: items, columns: { ...columns, [groupId]: list } })
    const before = list[list.indexOf(String(active.id)) + 1] ?? null
    void moveItem(String(active.id), groupId, before)
  }

  const onDragCancel = () => {
    setActiveId(null)
    setOverride(null)
  }

  return {
    groups: orderedGroups,
    groupSortIds: orderedGroups.map((g) => groupSortId(g.id)),
    columns,
    itemsById,
    activeItem: activeId && !isGroupDrag(activeId) ? itemsById.get(activeId) : undefined,
    activeGroup: activeId && isGroupDrag(activeId) ? groups.find((g) => g.id === groupIdOf(activeId)) : undefined,
    dndProps: { sensors, collisionDetection, onDragStart, onDragOver, onDragEnd, onDragCancel },
  }
}
