import { useState } from 'react';
import type { Application } from '../../lib/types';
import { STAGE_LABEL } from '../../lib/types';
import { errorMessage } from '../../lib/api';
import { Button, ErrorNote, Input } from '../../ui';
import { useDeleteApplication, useUpdateApplication } from './useApplications';

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function CardDialog({ app, onClose }: { app: Application; onClose: () => void }) {
  const [notes, setNotes] = useState(app.notes ?? '');
  const [followUp, setFollowUp] = useState(toLocalInput(app.followUpAt));
  const update = useUpdateApplication();
  const remove = useDeleteApplication();
  const error = update.error ?? remove.error;

  async function save() {
    await update.mutateAsync({
      id: app.id,
      notes,
      followUpAt: followUp ? new Date(followUp).toISOString() : undefined,
    });
    onClose();
  }

  async function del() {
    if (!confirm(`Delete "${app.title}"?`)) return;
    await remove.mutateAsync(app.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-slate-500">
          {app.company} · {STAGE_LABEL[app.stage]} · {app.source}
        </p>
        <h2 className="text-lg font-semibold">{app.title}</h2>
        {app.jobUrl && (
          <a className="text-sm text-indigo-600 hover:underline" href={app.jobUrl} target="_blank" rel="noreferrer">
            Open job posting
          </a>
        )}
        {app.appliedAt && <p className="mt-1 text-xs text-slate-500">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>}

        <label className="mt-4 block text-sm">
          Notes
          <textarea
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-sm">
          Follow-up reminder (emailed when due)
          <Input className="mt-1" type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
        </label>

        {error && <div className="mt-3"><ErrorNote message={errorMessage(error)} /></div>}

        <div className="mt-5 flex items-center gap-2">
          <Button variant="danger" size="sm" onClick={del} disabled={remove.isPending}>
            Delete
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={update.isPending}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
