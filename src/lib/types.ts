export const STAGES = ['SUGGESTED', 'SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  SUGGESTED: 'Suggested',
  SAVED: 'Saved',
  APPLIED: 'Applied',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
};

export interface Application {
  id: number;
  company: string;
  title: string;
  location: string | null;
  jobUrl: string | null;
  source: string;
  matchScore: number | null;
  stage: Stage;
  position: number;
  notes: string | null;
  appliedAt: string | null;
  followUpAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WorkMode = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'ANY';

export interface Profile {
  headline: string | null;
  experienceYears: number | null;
  currentCtcLpa: number | null;
  expectedCtcLpa: number | null;
  noticePeriodDays: number | null;
  workMode: WorkMode;
  skills: string[];
  targetRoles: string[];
  locations: string[];
  blacklistCompanies: string[];
  minMatchScore: number;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export interface ResumeUpload {
  resumeId: number;
  fileName: string;
  characters: number;
  extractedSkills: string[];
  skillsMerged: boolean;
}
