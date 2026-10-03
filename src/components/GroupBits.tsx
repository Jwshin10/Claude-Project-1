import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, MoreHorizontal, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { deleteGroup, moveGroup, updateGroup } from '../db/actions'
import { GROUP_COLOR_NAMES, GROUP_COLORS, type Group } from '../db/types'
import { cn } from '../lib/cn'
import { confirmAction } from '../lib/confirm'
import { Dropdown, MenuItem, MenuSeparator } from './Dropdown'
import { InlineInput } from './InlineInput'

/** A group's item list: a drop target (even when empty) and a sortable context. */
export function GroupDropZone({ groupId, itemIds, className, children }: { groupId: string; itemIds: string[]; className?: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: groupId })
  return (
    <SortableContext id={groupId} items={itemIds} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={cn(className, isOver && itemIds.length === 0 && 'rounded-md bg-hover')}>
        {children}
      </div>
    </SortableContext>
  )
}

interface HeaderProps {
  group: Group
  index: number
  groupCount: number
  itemCount: number
  /** Board columns move left/right rather than up/down. */
  horizontal?: boolean
}

export function GroupHeader({ group, index, groupCount, itemCount, horizontal }: HeaderProps) {
  const color = GROUP_COLORS[group.color]

  const remove = async () => {
    const ok = await confirmAction({
      title: `Delete "${group.name}"?`,
      message: itemCount > 0 ? `Its ${itemCount} item${itemCount === 1 ? '' : 's'} will be deleted too.` : undefined,
    })
    if (ok) void deleteGroup(group.id)
  }

  return (
    <div className="group/header flex items-center gap-2">
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <InlineInput
        value={group.name}
        onCommit={(name) => updateGroup(group.id, { name })}
        aria-label="Group name"
        className="min-w-0 flex-1 text-sm font-semibold"
      />
      <span className="text-xs text-faint tabular-nums">{itemCount}</span>
      <Dropdown label={<MoreHorizontal size={16} />} ariaLabel={`Options for ${group.name}`}>
        {(close) => (
          <>
            <div className="flex flex-wrap gap-1.5 px-2 py-1.5" aria-label="Group colour">
              {GROUP_COLOR_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-label={name}
                  aria-pressed={group.color === name}
                  onClick={() => {
                    void updateGroup(group.id, { color: name })
                    close()
                  }}
                  className={cn('size-5 rounded-full ring-offset-2 ring-offset-surface', group.color === name && 'ring-2 ring-text')}
                  style={{ background: GROUP_COLORS[name] }}
                />
              ))}
            </div>
            <MenuSeparator />
            {index > 0 && (
              <MenuItem
                onClick={() => {
                  void moveGroup(group.id, index - 1)
                  close()
                }}
              >
                {horizontal ? <ArrowLeft size={14} /> : <ArrowUp size={14} />} Move {horizontal ? 'left' : 'up'}
              </MenuItem>
            )}
            {index < groupCount - 1 && (
              <MenuItem
                onClick={() => {
                  void moveGroup(group.id, index + 1)
                  close()
                }}
              >
                {horizontal ? <ArrowRight size={14} /> : <ArrowDown size={14} />} Move {horizontal ? 'right' : 'down'}
              </MenuItem>
            )}
            <MenuItem
              danger
              onClick={() => {
                close()
                void remove()
              }}
            >
              <Trash2 size={14} /> Delete group
            </MenuItem>
          </>
        )}
      </Dropdown>
    </div>
  )
}
