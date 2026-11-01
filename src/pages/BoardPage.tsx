import { useMemo, useState, type FormEvent } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { STAGES, STAGE_LABEL, type Application, type Stage } from '../lib/types';
import { errorMessage } from '../lib/api';
import { Button, ErrorNote, Input, Spinner } from '../ui';
import { BoardCard, CardBody } from '../features/board/BoardCard';
import { CardDialog } from '../features/board/CardDialog';
import { positionBefore } from '../features/board/position';
import { useApplications, useCreateApplication, useMoveApplication } from '../features/board/useApplications';

function Column({ stage, cards, onOpen }: { stage: Stage; cards: Application[]; onOpen: (a: Application) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${stage}` });
  return (
    <section
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl p-2 ${isOver ? 'bg-indigo-50 ring-2 ring-indigo-200' : 'bg-slate-100'}`}
    >
      <header className="flex items-center justify-between px-1 pb-2">
        <h2 className="text-sm font-semibold text-slate-700">{STAGE_LABEL[stage]}</h2>
        <span className="rounded-full bg-white px-2 text-xs text-slate-500">{cards.length}</span>
      </header>
      <div className="flex min-h-24 flex-col gap-2">
        {cards.map((a) => (
          <BoardCard key={a.id} app={a} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function AddCard() {
  const create = useCreateApplication();
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [jobUrl, setJobUrl] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!company.trim() || !title.trim()) return;
    await create.mutateAsync({ company, title, jobUrl: jobUrl || undefined, stage: 'SAVED' });
    setCompany('');
    setTitle('');
    setJobUrl('');
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="w-40">
        <Input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      <div className="w-56">
        <Input placeholder="Job title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="w-64">
        <Input placeholder="Job URL (optional)" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
      </div>
      <Button type="submit" disabled={create.isPending}>
        Add to Saved
      </Button>
      {create.error && <ErrorNote message={errorMessage(create.error)} />}
    </form>
  );
}

export default function BoardPage() {
  const { data, isLoading, error } = useApplications();
  const move = useMoveApplication();
  const [open, setOpen] = useState<Application | null>(null);
  const [dragging, setDragging] = useState<Application | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  const byStage = useMemo(() => {
    const m = Object.fromEntries(STAGES.map((s) => [s, [] as Application[]])) as Record<Stage, Application[]>;
    (data ?? []).forEach((a) => m[a.stage].push(a));
    STAGES.forEach((s) => m[s].sort((a, b) => a.position - b.position));
    return m;
  }, [data]);

  const findCard = (dndId: string | number) => data?.find((a) => `card:${a.id}` === String(dndId));

  function onDragStart(e: DragStartEvent) {
    setDragging(findCard(e.active.id) ?? null);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setDragging(null);
    const card = findCard(active.id);
    if (!card || !over || over.id === active.id) return;
    const overId = String(over.id);
    if (overId.startsWith('col:')) {
      const stage = overId.slice(4) as Stage;
      if (stage !== card.stage) move.mutate({ id: card.id, stage, position: null });
      return;
    }
    const target = findCard(overId);
    if (!target) return;
    move.mutate({ id: card.id, stage: target.stage, position: positionBefore(byStage[target.stage], target.id, card.id) });
  }

  if (isLoading) return <Spinner label="Loading board" />;
  if (error) return <ErrorNote message={errorMessage(error)} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Application board</h1>
          <p className="text-sm text-slate-500">Drag cards between stages. Strong matches arrive in Suggested automatically.</p>
        </div>
        <AddCard />
      </div>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((s) => (
            <Column key={s} stage={s} cards={byStage[s]} onOpen={setOpen} />
          ))}
        </div>
        <DragOverlay>
          {dragging && (
            <div className="w-68 rotate-2 rounded-lg bg-white p-3 shadow-lg ring-1 ring-indigo-300">
              <CardBody app={dragging} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
      {open && <CardDialog app={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
