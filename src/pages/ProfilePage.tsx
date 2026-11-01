import { useEffect, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coreApi, errorMessage } from '../lib/api';
import type { Profile, ResumeUpload, WorkMode } from '../lib/types';
import { Badge, Button, Card, ErrorNote, Input, Spinner } from '../ui';

const num = (max: number) =>
  z.string().refine((v) => v.trim() === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= max), `0 to ${max}`);

const schema = z.object({
  headline: z.string().max(160),
  experienceYears: num(50),
  currentCtcLpa: num(9999),
  expectedCtcLpa: num(9999),
  noticePeriodDays: num(365),
  workMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE', 'ANY']),
  skills: z.string(),
  targetRoles: z.string(),
  locations: z.string(),
  blacklistCompanies: z.string(),
  minMatchScore: num(100),
  quietHoursStart: z.string(),
  quietHoursEnd: z.string(),
});
type Form = z.infer<typeof schema>;

const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
const toNum = (s: string) => (s.trim() === '' ? null : Number(s));
const time = (s: string | null) => (s ? s.slice(0, 5) : '');

function toForm(p: Profile): Form {
  return {
    headline: p.headline ?? '',
    experienceYears: p.experienceYears?.toString() ?? '',
    currentCtcLpa: p.currentCtcLpa?.toString() ?? '',
    expectedCtcLpa: p.expectedCtcLpa?.toString() ?? '',
    noticePeriodDays: p.noticePeriodDays?.toString() ?? '',
    workMode: p.workMode,
    skills: p.skills.join(', '),
    targetRoles: p.targetRoles.join(', '),
    locations: p.locations.join(', '),
    blacklistCompanies: p.blacklistCompanies.join(', '),
    minMatchScore: String(p.minMatchScore),
    quietHoursStart: time(p.quietHoursStart),
    quietHoursEnd: time(p.quietHoursEnd),
  };
}

function toProfile(f: Form): Profile {
  return {
    headline: f.headline.trim() || null,
    experienceYears: toNum(f.experienceYears),
    currentCtcLpa: toNum(f.currentCtcLpa),
    expectedCtcLpa: toNum(f.expectedCtcLpa),
    noticePeriodDays: toNum(f.noticePeriodDays),
    workMode: f.workMode as WorkMode,
    skills: list(f.skills),
    targetRoles: list(f.targetRoles),
    locations: list(f.locations),
    blacklistCompanies: list(f.blacklistCompanies),
    minMatchScore: toNum(f.minMatchScore) ?? 70,
    quietHoursStart: f.quietHoursStart || null,
    quietHoursEnd: f.quietHoursEnd || null,
  };
}

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && !error && <span className="text-xs text-slate-400">{hint}</span>}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}

function ResumeCard() {
  const qc = useQueryClient();
  const [result, setResult] = useState<ResumeUpload | null>(null);
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return (await coreApi.post<ResumeUpload>('/profile/resume?mergeSkills=true', fd)).data;
    },
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) upload.mutate(f);
    e.target.value = '';
  }

  return (
    <Card>
      <h2 className="font-semibold">Resume</h2>
      <p className="mb-3 text-sm text-slate-500">Upload a PDF; detected skills are added to your profile.</p>
      <input type="file" accept="application/pdf" onChange={onFile} className="text-sm" disabled={upload.isPending} />
      {upload.isPending && <Spinner label="Reading resume" />}
      {upload.error && <div className="mt-2"><ErrorNote message={errorMessage(upload.error)} /></div>}
      {result && (
        <div className="mt-3 text-sm">
          <p className="text-slate-600">
            {result.fileName}: {result.extractedSkills.length} skills found
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {result.extractedSkills.map((s) => (
              <Badge key={s} tone="indigo">{s}</Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ['profile'], queryFn: async () => (await coreApi.get<Profile>('/profile')).data });
  const { register, handleSubmit, reset, formState } = useForm<Form>({ resolver: zodResolver(schema) });
  const save = useMutation({
    mutationFn: async (p: Profile) => (await coreApi.put<Profile>('/profile', p)).data,
    onSuccess: (p) => qc.setQueryData(['profile'], p),
  });

  useEffect(() => {
    if (profile.data) reset(toForm(profile.data));
  }, [profile.data, reset]);

  if (profile.isLoading) return <Spinner label="Loading profile" />;
  if (profile.error) return <ErrorNote message={errorMessage(profile.error)} />;
  const e = formState.errors;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h1 className="text-xl font-semibold">Matching profile</h1>
        <p className="mb-4 text-sm text-slate-500">Jobs are scored against this. Lists are comma-separated.</p>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit((f) => save.mutate(toProfile(f)))}>
          <div className="sm:col-span-2">
            <Field label="Headline" error={e.headline?.message}>
              <Input placeholder="Full stack developer, React + Spring Boot" {...register('headline')} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Skills" hint="Java, Spring Boot, React, TypeScript, Kafka…">
              <Input {...register('skills')} />
            </Field>
          </div>
          <Field label="Target roles" hint="Full Stack Developer, Java Developer">
            <Input {...register('targetRoles')} />
          </Field>
          <Field label="Preferred locations" hint="Bengaluru, Hyderabad, Remote">
            <Input {...register('locations')} />
          </Field>
          <Field label="Experience (years)" error={e.experienceYears?.message}>
            <Input inputMode="decimal" {...register('experienceYears')} />
          </Field>
          <Field label="Work mode">
            <select className="w-full rounded-lg px-3 py-2 text-sm ring-1 ring-slate-300" {...register('workMode')}>
              <option value="ANY">Any</option>
              <option value="REMOTE">Remote only</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">On-site</option>
            </select>
          </Field>
          <Field label="Current CTC (LPA)" error={e.currentCtcLpa?.message}>
            <Input inputMode="decimal" {...register('currentCtcLpa')} />
          </Field>
          <Field label="Expected CTC (LPA)" error={e.expectedCtcLpa?.message}>
            <Input inputMode="decimal" {...register('expectedCtcLpa')} />
          </Field>
          <Field label="Notice period (days)" error={e.noticePeriodDays?.message}>
            <Input inputMode="numeric" {...register('noticePeriodDays')} />
          </Field>
          <Field label="Instant alert threshold (%)" error={e.minMatchScore?.message} hint="Lower scores go to the daily digest">
            <Input inputMode="numeric" {...register('minMatchScore')} />
          </Field>
          <Field label="Quiet hours start">
            <Input type="time" {...register('quietHoursStart')} />
          </Field>
          <Field label="Quiet hours end">
            <Input type="time" {...register('quietHoursEnd')} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Never show these companies">
              <Input {...register('blacklistCompanies')} />
            </Field>
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save profile'}
            </Button>
            {save.isSuccess && !formState.isDirty && <span className="text-sm text-emerald-600">Saved</span>}
            {save.error && <ErrorNote message={errorMessage(save.error)} />}
          </div>
        </form>
      </Card>
      <ResumeCard />
    </div>
  );
}
