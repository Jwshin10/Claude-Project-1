import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Ellipsis, Menu, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { deleteGroup, moveGroup, updateGroup } from '../db/actions'
import { colorVar, type Group } from '../db/types'
import { cn } from '../lib/cn'
import { confirmAction } from '../lib/confirm'
import { ColorSwatches } from './ColorSwatches'
import { Dropdown, MenuItem, MenuLabel, MenuSeparator } from './Dropdown'
import { InlineInput } from './InlineInput'
import { groupSortId } from './usePlanDnd'

/** A group's item list: a drop target (even when empty) and a sortable context. */
export function GroupDropZone({ groupId, itemIds, className, children }: { groupId: string; itemIds: string[]; className?: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: groupId, data: { type: 'container' } })
  return (
    <SortableContext id={groupId} items={itemIds} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={cn(className, isOver && itemIds.length === 0 && 'rounded-[10px] bg-fill-4')}>
        {children}
      </div>
    </SortableContext>
  )
}

/** A whole group (header and items) that can be dragged by its reorder control. */
export function SortableGroup({ group, className, children }: { group: Group; className?: string; children: (grip: ReactNode) => ReactNode }) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: groupSortId(group.id),
    data: { type: 'group' },
  })
  return (
    <section
      ref={setNodeRef}
      aria-label={group.name}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(className, isDragging && 'opacity-30')}
    >
      {children(
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Drag to move ${group.name}`}
          title="Drag to reorder"
          className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-label-3 opacity-0 transition-opacity group-hover/header:opacity-100 hover:text-label-2 focus-visible:opacity-100 active:cursor-grabbing [@media(hover:none)]:opacity-100"
        >
          <Menu size={17} />
        </button>,
      )}
    </section>
  )
}

/** What follows the pointer while a group is dragged. */
export function GroupDragPreview({ group, itemCount }: { group: Group; itemCount: number }) {
  return (
    <div className="flex w-fit cursor-grabbing items-center gap-2.5 rounded-[12px] bg-elevated py-2 pr-4 pl-3 shadow-float">
      <span className="size-2.5 rounded-full" style={{ background: colorVar(group.color) }} />
      <span className="text-headline font-semibold">{group.name}</span>
      <span className="text-subhead text-label-2 tabular-nums">{itemCount}</span>
    </div>
  )
}

interface HeaderProps {
  group: Group
  index: number
  groupCount: number
  itemCount: number
  /** Board columns move left/right and use a smaller header. */
  board?: boolean
  grip?: ReactNode
}

export function GroupHeader({ group, index, groupCount, itemCount, board, grip }: HeaderProps) {
  const remove = async () => {
    const ok = await confirmAction({
      title: `Delete “${group.name}”?`,
      message: itemCount > 0 ? `This also deletes its ${itemCount} item${itemCount === 1 ? '' : 's'}.` : undefined,
      confirmLabel: 'Delete',
    })
    if (ok) void deleteGroup(group.id)
  }

  return (
    <div className={cn('group/header flex items-center gap-1', board ? 'min-h-9 px-1' : 'min-h-11 border-b border-separator pb-1')}>
      <span className={cn('mr-1.5 shrink-0 rounded-full', board ? 'ml-1 size-2.5' : 'ml-1.5 size-3')} style={{ background: colorVar(group.color) }} aria-hidden />
      <InlineInput
        value={group.name}
        onCommit={(name) => updateGroup(group.id, { name })}
        aria-label="Group name"
        className={cn('min-w-0 flex-1 font-semibold', board ? 'text-headline' : 'text-title-3 tracking-[-0.015em]')}
      />
      <span className="px-1 text-subhead text-label-2 tabular-nums">{itemCount > 0 ? itemCount : ''}</span>
      {grip}
      <Dropdown label={<Ellipsis size={18} />} ariaLabel={`Options for ${group.name}`}>
        {(close) => (
          <>
            <MenuLabel>Color</MenuLabel>
            <ColorSwatches
              value={group.color}
              onChange={(color) => {
                void updateGroup(group.id, { color })
                close()
              }}
            />
            <MenuSeparator />
            {index > 0 && (
              <MenuItem
                icon={board ? <ArrowLeft size={16} /> : <ArrowUp size={16} />}
                onClick={() => {
                  close()
                  void moveGroup(group.id, index - 1)
                }}
              >
                {board ? 'Move Left' : 'Move Up'}
              </MenuItem>
            )}
            {index < groupCount - 1 && (
              <MenuItem
                icon={board ? <ArrowRight size={16} /> : <ArrowDown size={16} />}
                onClick={() => {
                  close()
                  void moveGroup(group.id, index + 1)
                }}
              >
                {board ? 'Move Right' : 'Move Down'}
              </MenuItem>
            )}
            {groupCount > 1 && <MenuSeparator />}
            <MenuItem
              destructive
              icon={<Trash2 size={16} />}
              onClick={() => {
                close()
                void remove()
              }}
            >
              Delete Group
            </MenuItem>
          </>
        )}
      </Dropdown>
    </div>
  )
}
