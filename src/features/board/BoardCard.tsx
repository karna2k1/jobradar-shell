import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { Application } from '../../lib/types';
import { ScoreBadge } from '../../ui';

export function CardBody({ app }: { app: Application }) {
  const due = app.followUpAt && new Date(app.followUpAt) <= new Date();
  return (
    <>
      <p className="text-xs text-slate-500">{app.company}</p>
      <p className="text-sm font-medium leading-snug text-slate-900">{app.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {app.matchScore != null && <ScoreBadge score={app.matchScore} />}
        {app.location && <span className="text-xs text-slate-500">{app.location}</span>}
        {app.followUpAt && (
          <span className={`text-xs ${due ? 'font-medium text-amber-700' : 'text-slate-400'}`}>
            Follow up {new Date(app.followUpAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </>
  );
}

/** Draggable card that is also a drop target (dropping on it inserts before it). */
export function BoardCard({ app, onOpen }: { app: Application; onOpen: (a: Application) => void }) {
  const drag = useDraggable({ id: `card:${app.id}` });
  const drop = useDroppable({ id: `card:${app.id}` });
  return (
    <div
      ref={(el) => {
        drag.setNodeRef(el);
        drop.setNodeRef(el);
      }}
      {...drag.listeners}
      {...drag.attributes}
      onClick={() => onOpen(app)}
      className={`cursor-grab rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-300 ${
        drag.isDragging ? 'opacity-40' : ''
      } ${drop.isOver && !drag.isDragging ? 'border-t-2 border-indigo-500' : ''}`}
    >
      <CardBody app={app} />
    </div>
  );
}
