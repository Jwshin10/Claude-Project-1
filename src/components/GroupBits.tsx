import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, GripVertical, MoreHorizontal, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { deleteGroup, moveGroup, updateGroup } from '../db/actions'
import { GROUP_COLOR_NAMES, GROUP_COLORS, type Group } from '../db/types'
import { cn } from '../lib/cn'
import { confirmAction } from '../lib/confirm'
import { tabStyle } from '../lib/tab'
import { Dropdown, MenuItem, MenuSeparator } from './Dropdown'
import { InlineInput } from './InlineInput'
import { groupSortId } from './usePlanDnd'

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
  const { setNodeRef, isOver } = useDroppable({ id: groupId, data: { type: 'container' } })
  return (
    <SortableContext id={groupId} items={itemIds} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={cn(className, isOver && itemIds.length === 0 && 'bg-[var(--tab-soft)]')}>
        {children}
      </div>
    </SortableContext>
  )
}

/** A whole group (tab and items) that can be dragged by the grip on its tab. */
export function SortableGroup({ group, className, children }: { group: Group; className?: string; children: (grip: ReactNode) => ReactNode }) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: groupSortId(group.id),
    data: { type: 'group' },
  })
  return (
    <section
      ref={setNodeRef}
      aria-label={group.name}
      style={{ ...tabStyle(group), transform: CSS.Translate.toString(transform), transition }}
      className={cn(className, isDragging && 'opacity-30')}
    >
      {children(
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Drag to move ${group.name}`}
          title="Drag to move this group"
          className="flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-ink-3 opacity-40 transition-opacity group-hover/tab:opacity-100 hover:text-ink focus-visible:opacity-100 active:cursor-grabbing [@media(hover:none)]:opacity-100"
        >
          <GripVertical size={15} />
        </button>,
      )}
    </section>
  )
}

/** What follows the pointer while a group is dragged: just its tab. */
export function GroupDragPreview({ group, itemCount }: { group: Group; itemCount: number }) {
  return (
    <div style={tabStyle(group)} className="flex w-fit -rotate-1 cursor-grabbing items-center gap-2 rounded-lg bg-[var(--tab-soft)] py-1.5 pr-3.5 pl-2 shadow-paper">
      <GripVertical size={15} className="text-ink-3" aria-hidden />
      <span className="font-display text-[17px] leading-7">{group.name}</span>
      <span className="text-[13px] text-ink-2 tabular-nums">{itemCount}</span>
    </div>
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
  /** The drag grip shown at the start of the tab. */
  grip?: ReactNode
}

/** A binder divider: a coloured tab carrying the group's name, over a line in the same colour. */
export function GroupHeader({ group, index, groupCount, itemCount, doneCount, horizontal, grip }: HeaderProps) {
  const remove = async () => {
    const ok = await confirmAction({
      title: `Delete "${group.name}"?`,
      message: itemCount > 0 ? `Its ${itemCount} item${itemCount === 1 ? '' : 's'} will be deleted too.` : undefined,
    })
    if (ok) void deleteGroup(group.id)
  }


  return (
    <div className="flex items-end gap-2 border-b-2 border-[var(--tab)]">
      <div className="group/tab flex min-w-0 items-center rounded-t-lg bg-[var(--tab-soft)] pt-1.5 pr-3 pb-1 pl-1">
        {grip}
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
