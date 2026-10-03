import {
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'
import { moveItem } from '../db/actions'
import type { Group, Item } from '../db/types'

/** groupId -> ordered item ids */
export type Columns = Record<string, string[]>

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

/**
 * Drag-and-drop state shared by the list and board views. Items can be
 * reordered within a group or dragged into another group.
 *
 * While dragging (and right after dropping, until the database reports the
 * change) we render from a local `override` so cards don't snap back. The
 * override is tied to the `items` array it was based on, so it is dropped
 * automatically as soon as a fresh query result arrives.
 */
export function useItemDnd(groups: Group[], items: Item[]) {
  const built = useMemo(() => buildColumns(groups, items), [groups, items])
  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const [override, setOverride] = useState<{ basis: Item[]; columns: Columns } | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const columns = override?.basis === items ? override.columns : built

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Long-press on touch screens, so normal swipes still scroll the page.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
    setOverride({ basis: items, columns })
  }

  // Moving between groups happens during the drag so the target group opens a gap.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
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

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
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
    columns,
    itemsById,
    activeItem: activeId ? itemsById.get(activeId) : undefined,
    dndProps: { sensors, collisionDetection: closestCorners, onDragStart, onDragOver, onDragEnd, onDragCancel },
  }
}
