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
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8 md:px-12 md:py-14">
      <h1 className="text-3xl font-bold tracking-tight">Settings &amp; backup</h1>

      <Section title="Storage">
        <p className="text-sm text-muted">
          Your plans are stored only in this browser on this device. Nothing is uploaded. Export a backup now and then, and before clearing
          browser data.
        </p>
      </Section>

      <Section title="Backup">
        <div className="flex flex-wrap gap-2">
          <Button onClick={download}>
            <Download size={16} /> Export backup
          </Button>
          <Button onClick={() => fileInput.current?.click()}>
            <Upload size={16} /> Restore from backup…
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

      <Section title="Danger zone">
        <Button onClick={wipe} className="text-danger">
          <Trash2 size={16} /> Delete all data
        </Button>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-b border-border pb-1.5 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Button({ onClick, children, className }: { onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-hover', className)}
    >
      {children}
    </button>
  )
}
