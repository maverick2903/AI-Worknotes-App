
export type TabName = 'daily' | 'weekly' | 'monthly' | 'insights' | 'analytics';

export interface Note {
  content: string;
  timestamp: string;
  mood?: string;
  tags?: string[];
}

export interface JournalData {
  notes: Record<string, Note>;
  weeklySummaries: Record<string, string>;
  monthlySummaries: Record<string, string>;
  moodHistory: Record<string, string>;
  techStack: Record<string, number>;
  insights: {
    lastGenerated: string | null;
    comprehensive: string | null;
    mood: string | null;
    productivity: string | null;
    techStack: string | null;
  };
}

export interface SyncStatus {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

export interface GithubConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
  branch: string;
}
