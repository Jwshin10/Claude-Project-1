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

const COLOR_LABEL: Record<string, string> = {
  gray: 'Graphite',
  blue: 'Blue',
  green: 'Green',
  orange: 'Orange',
  purple: 'Violet',
  pink: 'Pink',
  yellow: 'Mustard',
  red: 'Red',
}

/** A group's item list: a drop target (even when empty) and a sortable context. */
export function GroupDropZone({ groupId, itemIds, className, children }: { groupId: string; itemIds: string[]; className?: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: groupId })
  return (
    <SortableContext id={groupId} items={itemIds} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={cn(className, isOver && itemIds.length === 0 && 'bg-[var(--tab-soft)]')}>
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
  doneCount: number
  /** Board columns move left/right rather than up/down. */
  horizontal?: boolean
}

/** A binder divider: a coloured tab carrying the group's name, over a line in the same colour. */
export function GroupHeader({ group, index, groupCount, itemCount, doneCount, horizontal }: HeaderProps) {
  const remove = async () => {
    const ok = await confirmAction({
      title: `Delete "${group.name}"?`,
      message: itemCount > 0 ? `Its ${itemCount} item${itemCount === 1 ? '' : 's'} will be deleted too.` : undefined,
    })
    if (ok) void deleteGroup(group.id)
  }


  return (
    <div className="flex items-end gap-2 border-b-2 border-[var(--tab)]">
      <div className="min-w-0 rounded-t-lg bg-[var(--tab-soft)] px-3 pt-1.5 pb-1">
        <InlineInput
          value={group.name}
          onCommit={(name) => updateGroup(group.id, { name })}
          aria-label="Group name"
          className="font-display text-[17px] leading-7 [field-sizing:content] max-w-full min-w-[3ch]"
        />
      </div>
      <div className="flex flex-1 items-center justify-end gap-1 pb-1">
        <span className="text-[13px] text-ink-3 tabular-nums" title={`${doneCount} of ${itemCount} done`}>
          {itemCount > 0 && `${doneCount}/${itemCount}`}
        </span>
        <Dropdown label={<MoreHorizontal size={17} />} ariaLabel={`Options for ${group.name}`} buttonClassName="size-7">
          {(close) => (
            <>
              <p className="px-2.5 pt-1 pb-2 text-xs text-ink-2">Tab colour</p>
              <div className="grid grid-cols-8 gap-1.5 px-2.5 pb-2" role="group" aria-label="Tab colour">
                {GROUP_COLOR_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    aria-label={COLOR_LABEL[name]}
                    title={COLOR_LABEL[name]}
                    aria-pressed={group.color === name}
                    onClick={() => {
                      void updateGroup(group.id, { color: name })
                      close()
                    }}
                    className={cn('size-5 rounded-full ring-offset-2 ring-offset-card', group.color === name && 'ring-2 ring-ink')}
                    style={{ background: GROUP_COLORS[name] }}
                  />
                ))}
              </div>
              <MenuSeparator />
              {index > 0 && (
                <MenuItem
                  onClick={() => {
                    close()
                    void moveGroup(group.id, index - 1)
                  }}
                >
                  {horizontal ? <ArrowLeft size={15} /> : <ArrowUp size={15} />} Move {horizontal ? 'left' : 'up'}
                </MenuItem>
              )}
              {index < groupCount - 1 && (
                <MenuItem
                  onClick={() => {
                    close()
                    void moveGroup(group.id, index + 1)
                  }}
                >
                  {horizontal ? <ArrowRight size={15} /> : <ArrowDown size={15} />} Move {horizontal ? 'right' : 'down'}
                </MenuItem>
              )}
              <MenuItem
                danger
                onClick={() => {
                  close()
                  void remove()
                }}
              >
                <Trash2 size={15} /> Delete group
              </MenuItem>
            </>
          )}
        </Dropdown>
      </div>
    </div>
  )
}
