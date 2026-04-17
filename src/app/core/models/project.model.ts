export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'warning' | 'error';
  lastScanDate: string;
  score: number;
  url: string;
  issuesCount: number;
}

export interface CreateProjectRequest {
  name: string;
  url: string;
  description?: string;
}
