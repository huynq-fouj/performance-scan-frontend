export interface Project {
  id: string;
  name: string;
  url: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  autoScanFrequency: string;
  lastScanAt?: string | Date;
  lastScore?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
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
