import { Download, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAllData, exportBackup, parseBackup, restoreBackup } from '../db/backup'
import { cn } from '../lib/cn'
import { confirmAction } from '../lib/confirm'
import { toISODate } from '../lib/dates'

export function SettingsPage() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const navigate = useNavigate()

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
        title: 'Replace everything on this device?',
        message: `Your current plans will be replaced by the ${backup.plans.length} plans in this backup.`,
        confirmLabel: 'Replace',
      })
      if (!ok) return
      await restoreBackup(backup)
      setMessage({ text: `Restored ${backup.plans.length} plans and ${backup.items.length} items.` })
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Could not read that file.', error: true })
    }
  }

  const wipe = async () => {
    const ok = await confirmAction({ title: 'Delete every plan on this device?', message: 'This cannot be undone unless you have a backup.', confirmLabel: 'Delete all' })
    if (!ok) return
    await deleteAllData()
    navigate('/')
  }

  return (
    <div className="mx-auto flex max-w-[40rem] flex-col gap-10 px-4 pt-9 pb-16 md:px-14 md:pt-16">
      <h1 className="font-display text-[2.1rem] leading-tight md:text-[2.6rem]">Settings &amp; backup</h1>

      <Section title="Where your plans live">
        <p className="max-w-[60ch] text-ink-2">
          Only in this browser, on this device. Nothing is uploaded and there is no account. Clearing your browser data erases them, so
          export a backup now and then.
        </p>
      </Section>

      <Section title="Backup">
        <div className="flex flex-wrap gap-2">
          <Button onClick={download}>
            <Download size={16} /> Export backup
          </Button>
          <Button onClick={() => fileInput.current?.click()}>
            <Upload size={16} /> Restore a backup
          </Button>
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
        </div>
        {message && (
          <p role="status" className={cn('text-sm', message.error ? 'text-danger' : 'text-ok')}>
            {message.text}
          </p>
        )}
      </Section>

      <Section title="Start over">
        <p className="text-ink-2">Delete every plan, group and item on this device.</p>
        <Button onClick={wipe} className="text-danger hover:border-danger">
          <Trash2 size={16} /> Delete all data
        </Button>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-rule pt-5">
      <h2 className="font-display text-lg">{title}</h2>
      {children}
    </section>
  )
}

function Button({ onClick, children, className }: { onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex h-9 w-fit items-center gap-2 rounded-lg border border-rule-strong bg-card px-3.5 text-sm font-medium shadow-paper hover:border-ink-3', className)}
    >
      {children}
    </button>
  )
}
