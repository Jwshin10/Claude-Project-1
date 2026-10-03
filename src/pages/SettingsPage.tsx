import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackLink, GroupedRow, GroupedSection, Toolbar } from '../components/Chrome'
import { deleteAllData, exportBackup, parseBackup, restoreBackup } from '../db/backup'
import { cn } from '../lib/cn'
import { confirmAction } from '../lib/confirm'
import { toISODate } from '../lib/dates'
import { useIsCompact } from '../lib/useMediaQuery'

export function SettingsPage() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const navigate = useNavigate()
  const compact = useIsCompact()

  const download = async () => {
    const backup = await exportBackup()
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `planvoice-backup-${toISODate()}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage({ text: `Exported ${backup.plans.length} plans and ${backup.items.length} items.` })
  }

  const restore = async (file: File) => {
    try {
      const backup = parseBackup(await file.text())
      const ok = await confirmAction({
        title: 'Replace Your Plans?',
        message: `Everything on this device will be replaced by the ${backup.plans.length} plans in this backup.`,
        confirmLabel: 'Replace',
      })
      if (!ok) return
      await restoreBackup(backup)
      setMessage({ text: `Restored ${backup.plans.length} plans and ${backup.items.length} items.` })
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'That file couldn’t be read.', error: true })
    }
  }

  const wipe = async () => {
    const ok = await confirmAction({ title: 'Delete All Data?', message: 'Every plan on this device will be deleted. You can’t undo this.', confirmLabel: 'Delete' })
    if (!ok) return
    await deleteAllData()
    navigate('/')
  }

  return (
    <div className="min-h-full bg-grouped">
      {compact && (
        <Toolbar>
          <BackLink to="/">Plans</BackLink>
        </Toolbar>
      )}
      <div className="flex max-w-[40rem] flex-col gap-7 px-4 pt-5 pb-16 md:px-10 md:pt-12">
        <h1 className="font-display text-large-title font-bold tracking-[-0.022em]">Settings</h1>

        <GroupedSection header="Backup" footer="Your plans are saved only in this browser on this device. Nothing is uploaded. Export a backup now and then, and before clearing browser data.">
          <GroupedRow>
            <button type="button" onClick={download} className="h-11 flex-1 text-left text-body text-tint">
              Export Backup
            </button>
          </GroupedRow>
          <GroupedRow>
            <button type="button" onClick={() => fileInput.current?.click()} className="h-11 flex-1 text-left text-body text-tint">
              Restore from Backup…
            </button>
          </GroupedRow>
        </GroupedSection>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void restore(file)
          }}
        />
        {message && (
          <p role="status" className={cn('-mt-3 px-4 text-footnote', message.error ? 'text-red' : 'text-green')}>
            {message.text}
          </p>
        )}

        <GroupedSection footer="Deletes every plan, group and item on this device.">
          <GroupedRow>
            <button type="button" onClick={wipe} className="h-11 flex-1 text-left text-body text-red">
              Delete All Data
            </button>
          </GroupedRow>
        </GroupedSection>
      </div>
    </div>
  )
}
