export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'warning' | 'error';
  lastScanDate: string;
  score: number;
  url: string;
  issuesCount: number;
  logo?: string;
}

export interface CreateProjectRequest {
  name: string;
  url: string;
  description?: string;
  logo?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  isActive?: boolean;
}
